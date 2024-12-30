// frontend/admin/src/features/prizes/components/PrizeTemplateBuilder.tsx

import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { 
  Trophy, Gift, Coins, DollarSign, CreditCard,
  ChevronRight, ChevronLeft, Check, AlertCircle
} from 'lucide-react';
import { useTemplateStore } from '../store/PrizeTemplateStore';
import type { 
  PrizeType, 
  PrizeTier, 
  PrizeTemplateFormData,
  PrizeTemplate 
} from '@/types/prizes';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error';
import { formatCurrency } from '@/utils/currency';

// Define core business types
interface FormStep {
  title: string;
  description: string;
  validationFn: (data: Partial<PrizeTemplateFormData>) => boolean;
}

interface PrizeTypeOption {
  id: PrizeType;
  label: string;
  icon: typeof Trophy | typeof Gift;
  description: string;
}

interface PrizeTierOption {
  id: PrizeTier;
  label: string;
  color: string;
  description: string;
}

// Business configuration constants
const PRIZE_TYPES: PrizeTypeOption[] = [
  { 
    id: 'instant_win', 
    label: 'Instant Win', 
    icon: Trophy,
    description: 'Prize is revealed immediately upon ticket selection'
  },
  { 
    id: 'draw_win', 
    label: 'Draw Win', 
    icon: Gift,
    description: 'Prize is awarded through scheduled prize draws'
  }
];

const PRIZE_TIERS: PrizeTierOption[] = [
  { 
    id: 'platinum', 
    label: 'Platinum', 
    color: 'bg-gradient-to-r from-gray-800 to-gray-600',
    description: 'Premium tier with highest value prizes'
  },
  { 
    id: 'gold', 
    label: 'Gold', 
    color: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
    description: 'High-value prizes with excellent rewards'
  },
  { 
    id: 'silver', 
    label: 'Silver', 
    color: 'bg-gradient-to-r from-gray-400 to-gray-300',
    description: 'Mid-tier prizes with good value'
  },
  { 
    id: 'bronze', 
    label: 'Bronze', 
    color: 'bg-gradient-to-r from-orange-800 to-orange-700',
    description: 'Entry-level prizes with fair rewards'
  }
];

const FORM_STEPS: FormStep[] = [
  {
    title: 'Basic Information',
    description: 'Choose the template name and type',
    validationFn: (data) => Boolean(data.name && data.type)
  },
  {
    title: 'Prize Tier',
    description: 'Select the prize tier level',
    validationFn: (data) => Boolean(data.tier)
  },
  {
    title: 'Value Configuration',
    description: 'Configure prize values',
    validationFn: (data) => {
      const values = [data.retail_value, data.cash_value, data.credit_value];
      return values.every(v => typeof v === 'number' && v > 0);
    }
  },
  {
    title: 'Review',
    description: 'Review and create template',
    validationFn: () => true
  }
];

export function PrizeTemplateBuilder() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const { 
      draftTemplate, 
      setDraftTemplate, 
      validationErrors,
      createTemplate,
      isLoading,
      error,
      clearErrors 
    } = useTemplateStore();
  
    // Event handlers with proper typing
    const handleStepComplete = async (stepData: Partial<PrizeTemplateFormData>) => {
      const updatedTemplate = { ...draftTemplate, ...stepData };
      setDraftTemplate(updatedTemplate);
      
      if (currentStep === FORM_STEPS.length - 1) {
        try {
          await createTemplate(updatedTemplate as PrizeTemplateFormData);
          router.push('/admin/prizes/templates');
        } catch (error) {
          console.error('Failed to create template:', error);
        }
      } else {
        setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length - 1));
      }
    };
  
    const handlePreviousStep = useCallback(() => {
      setCurrentStep(prev => Math.max(prev - 1, 0));
      clearErrors();
    }, [clearErrors]);
  
    const handleValueChange = useCallback((
      key: keyof PrizeTemplateFormData,
      value: string | number
    ) => {
        // Direct update instead of returning the function
        setDraftTemplate({
            ...draftTemplate, // Use current state directly
            [key]: typeof value === 'string' ? value : Number(value)
        });
    }, [draftTemplate]); // Add draftTemplate to dependencies
  
    // Step renderers
    const renderBasicInfo = () => (
      <div className="space-y-6">
        {/* Previous basic info implementation remains the same */}
      </div>
    );
  
    const renderTierSelection = () => (
      <div className="grid grid-cols-2 gap-6">
        {PRIZE_TIERS.map(tier => (
          <button
            key={tier.id}
            type="button"
            onClick={() => handleValueChange('tier', tier.id)}
            className={`
              relative p-6 rounded-lg text-white transition-all duration-200
              ${tier.color}
              ${draftTemplate?.tier === tier.id ? 'ring-2 ring-offset-2 ring-indigo-500' : 'hover:opacity-90'}
            `}
          >
            <h3 className="text-lg font-semibold mb-2">{tier.label}</h3>
            <p className="text-sm opacity-90">{tier.description}</p>
            {draftTemplate?.tier === tier.id && (
              <div className="absolute top-2 right-2 bg-white/20 rounded-full p-1">
                <Check className="w-5 h-5" />
              </div>
            )}
          </button>
        ))}
      </div>
    );
  
    const renderValueConfig = () => (
      <div className="space-y-6">
        {[
          { key: 'retail_value', label: 'Retail Value', icon: DollarSign },
          { key: 'cash_value', label: 'Cash Value', icon: Coins },
          { key: 'credit_value', label: 'Credit Value', icon: CreditCard }
        ].map(({ key, label, icon: Icon }) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={draftTemplate?.[key as keyof PrizeTemplateFormData]?.toString() ?? ''}
                onChange={e => handleValueChange(
                  key as keyof PrizeTemplateFormData,
                  parseFloat(e.target.value) || 0
                )}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-colors"
                min="0"
                step="0.01"
              />
            </div>
            {validationErrors[key] && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors[key]}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  
    const renderReview = () => (
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Template Name</h4>
                <p className="mt-1 text-lg font-medium">{draftTemplate?.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Prize Type</h4>
                <p className="mt-1 text-lg font-medium">
                  {PRIZE_TYPES.find(t => t.id === draftTemplate?.type)?.label}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Tier</h4>
                <p className="mt-1 text-lg font-medium">
                  {PRIZE_TIERS.find(t => t.id === draftTemplate?.tier)?.label}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Values</h4>
                <div className="mt-1 space-y-1">
                  <p className="font-medium">Retail: {formatCurrency(draftTemplate?.retail_value || 0)}</p>
                  <p className="font-medium">Cash: {formatCurrency(draftTemplate?.cash_value || 0)}</p>
                  <p className="font-medium">Credit: {formatCurrency(draftTemplate?.credit_value || 0)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  
    const renderStepContent = () => {
      switch (currentStep) {
        case 0:
          return renderBasicInfo();
        case 1:
          return renderTierSelection();
        case 2:
          return renderValueConfig();
        case 3:
          return renderReview();
        default:
          return null;
      }
    };
  
    if (error) {
      return (
        <ErrorState 
          title="Error Creating Template"
          message={error}
          onRetry={() => clearErrors()}
        />
      );
    }
  
    return (
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {FORM_STEPS.map((step, index) => (
              <div key={step.title} className="relative flex-1">
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-colors duration-200
                    ${currentStep >= index
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-500'
                    }
                  `}>
                    {index + 1}
                  </div>
                  {index < FORM_STEPS.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-4 transition-colors duration-200
                      ${currentStep > index ? 'bg-indigo-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
  
        {/* Step Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          {renderStepContent()}
        </div>
  
        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
            className={`
              inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
              transition-colors duration-200
              ${currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </button>
  
          <button
            type="button"
            onClick={() => handleStepComplete(draftTemplate || {})}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg
                     hover:bg-indigo-700 transition-colors duration-200 shadow-sm
                     hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="w-5 h-5 mr-2" />
                Processing...
              </>
            ) : (
              <>
                {currentStep === FORM_STEPS.length - 1 ? (
                  'Create Template'
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }