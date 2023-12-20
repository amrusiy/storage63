export type Item = {
    userId: string;
    unitId: string;
    sku: string;
    status: string;
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
        status: "active" | "faulty" | "lost";
      }
    | {
        type: "transfer";
        transferToUserId: string;
      }
  );
  