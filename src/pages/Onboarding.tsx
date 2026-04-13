/**
 * Onboarding wizard — shown once to new users before they reach the dashboard.
 * 4 steps: income → savings → debts estimate → financial goals.
 * Persists to user_profile (Supabase or localStorage demo mode) via ProfileContext.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, Loader2, DollarSign, PiggyBank, CreditCard, Target } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';

// ─── Step metadata ────────────────────────────────────────────────────────────

const GOAL_OPTIONS = [
  { id: 'emergency_fund',  label: 'Build an emergency fund',  emoji: '🛡️' },
  { id: 'pay_off_debt',    label: 'Pay off debt faster',      emoji: '💳' },
  { id: 'save_house',      label: 'Save for a house deposit', emoji: '🏡' },
  { id: 'retire_early',    label: 'Retire early',             emoji: '🌴' },
  { id: 'investments',     label: 'Grow my investments',      emoji: '📈' },
  { id: 'holiday',         label: 'Save for a holiday',       emoji: '✈️' },
  { id: 'education',       label: 'Fund education',           emoji: '🎓' },
  { id: 'other',           label: 'Other',                    emoji: '💡' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return isNaN(n) || n < 0 ? 0 : n;
}

// ─── Step sub-components ──────────────────────────────────────────────────────

interface MoneyStepProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function MoneyStep({ label, hint, value, onChange, placeholder = '0' }: MoneyStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: 'var(--text-2)' }}>{hint}</p>
      <div className="relative">
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold"
          style={{ color: 'var(--text-3)' }}
        >
          £
        </span>
        <input
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="apple-input pl-8 text-lg font-semibold"
          aria-label={label}
        />
      </div>
    </div>
  );
}

interface GoalsStepProps {
  selected: string[];
  onToggle: (id: string) => void;
}

function GoalsStep({ selected, onToggle }: GoalsStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: 'var(--text-2)' }}>
        Select all that apply — we'll tailor your insights.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {GOAL_OPTIONS.map(g => {
          const active = selected.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onToggle(g.id)}
              className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150"
              style={{
                background: active ? 'rgba(59,130,246,0.12)' : 'var(--bg-raised)',
                border:     `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                color:      active ? 'var(--accent)' : 'var(--text-1)',
              }}
            >
              <span className="text-base">{g.emoji}</span>
              <span className="leading-tight">{g.label}</span>
              {active && (
                <Check size={13} className="ml-auto flex-shrink-0" style={{ color: 'var(--accent)' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width:      i === current ? 20 : 6,
            height:     6,
            background: i <= current ? 'var(--accent)' : 'var(--border)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Monthly income',      subtitle: 'Helps us calculate your debt-to-income ratio.',   icon: DollarSign },
  { title: 'Current savings',     subtitle: 'Your total cash savings across all accounts.',     icon: PiggyBank  },
  { title: 'Estimated total debt', subtitle: 'Rough total — you can add exact debts later.',   icon: CreditCard },
  { title: 'Your financial goals', subtitle: 'What are you working towards?',                   icon: Target     },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function Onboarding() {
  const { saveProfile } = useProfile();
  const navigate = useNavigate();

  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [income,  setIncome]  = useState('');
  const [savings, setSavings] = useState('');
  const [debts,   setDebts]   = useState('');
  const [goals,   setGoals]   = useState<string[]>([]);

  const totalSteps = STEPS.length;
  const isLast     = step === totalSteps - 1;
  const { icon: StepIcon, title, subtitle } = STEPS[step];

  const toggleGoal = (id: string) =>
    setGoals(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);

  const canAdvance = () => {
    if (step === 0) return parseMoney(income) > 0;
    if (step === 3) return goals.length > 0;
    return true; // savings + debts are optional
  };

  const handleNext = async () => {
    if (!canAdvance()) return;

    if (!isLast) {
      setStep(s => s + 1);
      return;
    }

    // Final step — persist profile
    setSaving(true);
    try {
      await saveProfile({
        monthly_income:       parseMoney(income),
        current_savings:      parseMoney(savings),
        total_debts_estimate: parseMoney(debts),
        financial_goals:      goals,
        onboarding_completed: true,
      });
      navigate('/dashboard', { replace: true });
    } catch {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-page)' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Logo + step count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-white text-sm tracking-tight">SpendMapr</span>
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
            {step + 1} of {totalSteps}
          </span>
        </div>

        {/* Progress */}
        <StepDots total={totalSteps} current={step} />

        {/* Step header */}
        <div className="space-y-1">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(59,130,246,0.12)' }}
          >
            <StepIcon size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-lg font-bold text-white">{title}</h1>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>{subtitle}</p>
        </div>

        {/* Step content */}
        <div>
          {step === 0 && (
            <MoneyStep
              label="Monthly income"
              hint="Your approximate monthly take-home pay after tax."
              value={income}
              onChange={setIncome}
              placeholder="2500"
            />
          )}
          {step === 1 && (
            <MoneyStep
              label="Current savings"
              hint="Total cash in savings accounts, ISAs, or current accounts."
              value={savings}
              onChange={setSavings}
              placeholder="5000"
            />
          )}
          {step === 2 && (
            <MoneyStep
              label="Total debts"
              hint="Rough total across credit cards, loans, and overdrafts. Skip if none."
              value={debts}
              onChange={setDebts}
              placeholder="0"
            />
          )}
          {step === 3 && (
            <GoalsStep selected={goals} onToggle={toggleGoal} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-1">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="apple-button-secondary"
              style={{ minWidth: 48 }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={saving || !canAdvance()}
            className="apple-button-primary flex-1 disabled:opacity-40"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : isLast ? (
              <>
                <Check size={15} />
                Finish setup
              </>
            ) : (
              <>
                Continue
                <ChevronRight size={15} />
              </>
            )}
          </button>
        </div>

        {/* Skip link — only on optional steps */}
        {(step === 1 || step === 2) && (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            className="w-full text-center text-xs font-medium pt-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-3)' }}
          >
            Skip for now
          </button>
        )}
      </div>

      {/* Footer note */}
      <p className="mt-5 text-xs text-center max-w-xs" style={{ color: 'var(--text-3)' }}>
        Your data is stored securely. You can update these details anytime from your profile.
      </p>
    </div>
  );
}
