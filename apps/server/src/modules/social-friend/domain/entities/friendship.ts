import { FriendshipStatus } from "@prisma/client";
import { AggregateRoot } from "@/shared/domain";
import type { FriendshipProps } from "./friendship.props";
import type { CreateFriendshipInput } from "./input/create-friendship.input";
import type { ReconstituteFriendshipInput } from "./input/reconstitute-friendship.input";
import { FriendRequestAcceptedEvent } from "../events/friend-request-accepted.event";
import { FriendRequestSentEvent } from "../events/friend-request-sent.event";
import {
  FriendRequestAlreadyHandledError,
  NotFriendRequestParticipantError,
  SocialFriendValidationError,
} from "../errors/social-friend.error";

export class Friendship extends AggregateRoot<FriendshipProps> {
  private constructor(props: FriendshipProps) {
    super(props);
  }

  static create(input: CreateFriendshipInput): Friendship {
    const requesterId = input.requesterId.trim();
    const addresseeId = input.addresseeId.trim();

    if (!requesterId || !addresseeId) {
      throw new SocialFriendValidationError(
        "requesterId and addresseeId are required.",
      );
    }

    if (requesterId === addresseeId) {
      throw new SocialFriendValidationError(
        "You cannot add yourself as a friend.",
      );
    }

    const now = new Date();
    const friendship = new Friendship({
      id: crypto.randomUUID(),
      requesterId,
      addresseeId,
      status: FriendshipStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });

    friendship.addEvent(
      new FriendRequestSentEvent(friendship.id, friendship.version, {
        requesterId: friendship.requesterId,
        addresseeId: friendship.addresseeId,
      }),
    );

    return friendship;
  }

  static reconstitute(input: ReconstituteFriendshipInput): Friendship {
    return new Friendship({
      id: input.id,
      requesterId: input.requesterId,
      addresseeId: input.addresseeId,
      status: input.status,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      version: 1,
    });
  }

  accept(actorId: string): void {
    this.assertCanRespond(actorId);

    if (this.props.status !== FriendshipStatus.PENDING) {
      throw new FriendRequestAlreadyHandledError(this.id);
    }

    (this.props as FriendshipProps).status = FriendshipStatus.ACCEPTED;
    this.incrementVersion();
    this.addEvent(
      new FriendRequestAcceptedEvent(this.id, this.version, {
        requesterId: this.requesterId,
        addresseeId: this.addresseeId,
      }),
    );
  }

  assertCanRespond(actorId: string): void {
    if (this.addresseeId !== actorId) {
      throw new NotFriendRequestParticipantError(this.id, actorId);
    }
  }

  assertParticipant(actorId: string): void {
    if (this.requesterId !== actorId && this.addresseeId !== actorId) {
      throw new NotFriendRequestParticipantError(this.id, actorId);
    }
  }

  get requesterId(): string {
    return this.props.requesterId;
  }

  get addresseeId(): string {
    return this.props.addresseeId;
  }

  get status(): FriendshipStatus {
    return this.props.status;
  }

  get isAccepted(): boolean {
    return this.props.status === FriendshipStatus.ACCEPTED;
  }
}
