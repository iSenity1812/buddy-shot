import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SHORT_MONTH_NAMES } from "@/src/constants/time";
import DraggableBottomSheetModal from "@/src/components/ui/DraggableBottomSheetModal";

const MIN_YEAR = 2025;

export interface MonthYearPickerProps {
  visible: boolean;
  year: number;
  month: number;
  maxYear: number;
  maxMonth: number;
  minYear?: number;
  onConfirm: (year: number, month: number) => void;
  onClose: () => void;
}

export default function MonthYearPicker({
  visible,
  year: initYear,
  month: initMonth,
  maxYear,
  maxMonth,
  minYear = MIN_YEAR,
  onConfirm,
  onClose,
}: MonthYearPickerProps) {
  const [draftYear, setDraftYear] = useState(initYear);
  const [draftMonth, setDraftMonth] = useState(initMonth);

  useEffect(() => {
    if (visible) {
      setDraftYear(initYear);
      setDraftMonth(initMonth);
    }
  }, [visible, initYear, initMonth]);

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i,
  );

  const maxMonthForDraft = draftYear === maxYear ? maxMonth : 11;

  const handleYearSelect = (y: number) => {
    setDraftYear(y);
    if (y === maxYear && draftMonth > maxMonth) setDraftMonth(maxMonth);
  };

  const monthRows = Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 4 }, (__, col) => ({
      name: SHORT_MONTH_NAMES[row * 4 + col],
      index: row * 4 + col,
    })),
  );

  return (
    <DraggableBottomSheetModal
      visible={visible}
      onClose={onClose}
      maxHeightRatio={1}
    >
      {/* Year pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-5"
        contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
      >
        {years.map((y) => (
          <Pressable
            key={y}
            onPress={() => handleYearSelect(y)}
            className={`active:scale-95 px-5 py-2 rounded-full ${
              draftYear === y ? "bg-primary" : "bg-muted"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                draftYear === y
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {y}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Month grid 4 per row */}
      <View className="gap-2 mb-6">
        {monthRows.map((row, rowIdx) => (
          <View key={rowIdx} className="flex-row gap-2">
            {row.map(({ name, index: i }) => {
              const disabled = i > maxMonthForDraft;
              const selected = draftMonth === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => !disabled && setDraftMonth(i)}
                  disabled={disabled}
                  className={`active:scale-95 flex-1 items-center py-3 rounded-xl ${
                    selected
                      ? "bg-primary"
                      : disabled
                        ? "bg-muted opacity-40"
                        : "bg-muted"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selected ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Confirm */}
      <Pressable
        onPress={() => onConfirm(draftYear, draftMonth)}
        className="active:scale-95 bg-primary py-3.5 rounded-full items-center"
      >
        <Text className="text-base font-semibold text-primary-foreground">
          Done
        </Text>
      </Pressable>
    </DraggableBottomSheetModal>
  );
}
