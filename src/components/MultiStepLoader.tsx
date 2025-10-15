import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export type MultiStep = {
  title: string;
  description: string;
};

interface MultiStepLoaderProps {
  steps: MultiStep[];
  activeStep: number;
  status: 'running' | 'success';
}

export const MultiStepLoader = ({ steps, activeStep, status }: MultiStepLoaderProps) => {
  const progress = status === 'success'
    ? 100
    : Math.min(100, ((activeStep + 1) / steps.length) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-white">
      <div className="absolute inset-0 opacity-80" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(circle at 80% 0%, rgba(99,102,241,0.45), transparent 55%)'
      }} />
      <div className="relative p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-300">Verification pipeline</p>
            <h2 className="text-2xl font-semibold">Securing your credential</h2>
          </div>
          <span className="text-sm font-medium text-slate-300">{status === 'success' ? 'Completed' : `${Math.round(progress)}%`}</span>
        </div>

        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.6 }}
            className={`h-full ${status === 'success' ? 'bg-emerald-400' : 'bg-blue-500'}`}
          />
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = status === 'running' && index === activeStep;
            const isCompleted = status === 'success' || index < activeStep;

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-start gap-4 rounded-xl border border-white/10 p-4 ${isActive ? 'bg-white/10 shadow-lg backdrop-blur-sm' : 'bg-transparent'}`}
              >
                <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full border-2 ${isCompleted ? 'border-emerald-400 bg-emerald-400/10' : isActive ? 'border-blue-400 bg-blue-400/10' : 'border-slate-700'}`}>
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-emerald-300" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-200" />
                  ) : null}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
