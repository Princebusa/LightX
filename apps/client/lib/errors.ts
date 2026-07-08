export function formatApiError(error: unknown): string {
    if (typeof error === "string") return error;
  
    if (error && typeof error === "object") {
      const record = error as Record<string, unknown>;
  
      if (typeof record.message === "string") {
        return record.message;
      }
  
      if (typeof record.error === "string") {
        return record.error;
      }
  
      if (record.error && typeof record.error === "object") {
        const zodError = record.error as {
          formErrors?: string[];
          fieldErrors?: Record<string, string[]>;
          issues?: Array<{ message?: string }>;
        };
  
        if (zodError.issues?.length) {
          return zodError.issues[0]?.message ?? "Validation failed";
        }
  
        if (zodError.formErrors?.length) {
          return zodError.formErrors[0] ?? "Validation failed";
        }
  
        const fieldMessages = Object.values(zodError.fieldErrors ?? {}).flat();
        if (fieldMessages.length > 0) {
          return fieldMessages[0] ?? "Validation failed";
        }
      }
    }
  
    return "Something went wrong";
  }
  