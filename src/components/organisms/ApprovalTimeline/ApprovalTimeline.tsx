import React from 'react';
import { ApprovalStep } from '@/types';
import { ApprovalStepComponent } from '@/components/molecules/ApprovalStep/ApprovalStep';

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
  currentStep: number;
}

export const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({ steps, currentStep }) => {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <ApprovalStepComponent
          key={step.id}
          step={step}
          isLast={index === steps.length - 1}
          isCurrent={step.order === currentStep}
        />
      ))}
    </div>
  );
};
