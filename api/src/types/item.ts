export type Item = {
  id: string;
  userId: string;
  unitId: string;
  sku: string;
  status: ItemStatus;
  history: ItemEvent[];
};

export type ItemEvent = {
  timestamp: number;
  createdByUserId: string;
} & (
  | {
      type: "create";
    }
  | {
      type: "report";
      status: ItemStatus;
    }
  | {
      type: "transfer";
      transferToUserId: string;
    }
);

export type ItemStatus = "active" | "faulty" | "lost";
