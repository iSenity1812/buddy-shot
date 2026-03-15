/**
 * Base interface for all use cases.
 * Follows the Command/Query pattern — every use case has one input and one output.
 *
 * @template TInput  - The request object (Command or Query DTO)
 * @template TOutput - The resolved value (can be void for commands with no return)
 */
export interface IUseCase<TInput = void, TOutput = void> {
  execute(input: TInput): Promise<TOutput>;
}
