import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Família" },
  { id: 2, label: "Itens" },
  { id: 3, label: "Confirmar" },
] as const;

interface DeliveryStepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export function DeliveryStepIndicator({ currentStep }: DeliveryStepIndicatorProps) {
  return (
    <div className="mb-4 flex justify-center">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex w-[4.5rem] flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                    isActive && "bg-[#004E64] text-white",
                    isComplete && "bg-[#004E64]/20 text-[#004E64]",
                    !isActive && !isComplete && "bg-gray-200 text-gray-500",
                  )}
                >
                  {step.id}
                </div>
                <span
                  className={cn(
                    "text-center text-[10px] font-medium leading-tight",
                    isActive ? "text-[#004E64]" : "text-gray-500",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mb-4 h-0.5 w-8 sm:w-12",
                    step.id < currentStep ? "bg-[#004E64]/40" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
