// packages/docs/app/(home)/components/MotiaHubSection.tsx
'use client';

import { FormEvent, useState, useRef, useEffect } from 'react';
import Typography from '@/components/Typography';
import { FieldValues, SubmissionError, SubmissionSuccess } from '@formspree/core';
import { ValidationError } from '@formspree/react';
import { ArrowRight } from 'lucide-react';
import { BiLoaderAlt } from 'react-icons/bi';
import { ChevronRight } from 'lucide-react'; // Icon import
import {
  TextFlowIcon, // Explicitly import each icon
  AscendingSortIcon,
  CrossOverIcon,
  CheckIcon,
  SynchronizeRefreshIcon,
  PinLocationIcon,
  ZeroConfigDeploymentIcon, // Import individual icons directly
  RealTimeMonitoringIcon,
  TeamCollaborationIcon
} from '@/components/icons/WorkbenchIcons';


interface FormState<T extends FieldValues> {
  errors: SubmissionError<T> | null;
  result: SubmissionSuccess | null;
  submitting: boolean;
  succeeded: boolean;
}

interface BetaAccessFormProps {
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  state: FormState<FieldValues>;
}

const FORM_CONTENT = {
  EMAIL: {
    LABEL: 'Email',
    PLACEHOLDER: 'Enter your email',
  },
  SUBMIT: {
    BUTTON: 'Reserve Beta Access',
    SENDING: 'Submitting...',
  },
};

const BetaAccessForm = ({ handleSubmit, state }: BetaAccessFormProps) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md w-full">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          {FORM_CONTENT.EMAIL.LABEL}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-4 py-3 border border-purple-500/50 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 bg-indigo-950 text-white placeholder-purple-300/50"
          placeholder={FORM_CONTENT.EMAIL.PLACEHOLDER}
        />
        <ValidationError prefix={FORM_CONTENT.EMAIL.LABEL} field="email" errors={state.errors} />
      </div>
      <ValidationError errors={state.errors} />
      <div>
        <button
          type="submit"
          disabled={state.submitting}
          className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70"
        >
          {state.submitting ? (
            <>
              <BiLoaderAlt className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              {FORM_CONTENT.SUBMIT.SENDING}
            </>
          ) : (
            <>
              {FORM_CONTENT.SUBMIT.BUTTON}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
      </div>
      {state.succeeded && (
        <div className="text-green-400 text-sm mt-2">
          Success! You’ve reserved your beta access. We’ll be in touch soon!
        </div>
      )}
    </form>
  );
};

const MotiaHubSection = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // Formspree state, initialized only on client
  const [formState, setFormState] = useState<FormState<FieldValues>>({
    errors: null,
    result: null,
    submitting: false,
    succeeded: false,
  });
  const [handleSubmit, setHandleSubmit] = useState<(e: FormEvent<HTMLFormElement>) => void>(() => () => { });

  useEffect(() => {
    setIsMounted(true);

    // Dynamically import useForm only on client
    import('@formspree/react').then(({ useForm }) => {
      const [state, handleSubmit] = useForm('your-formspree-id'); // Replace with your Formspree ID
      setFormState(state);
      setHandleSubmit(() => handleSubmit);
    });

    const section = sectionRef.current;
    const glowElement = glowRef.current;
    if (!section || !glowElement) return;

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      requestAnimationFrame(() => {
        glowElement.style.left = `${x}px`;
        glowElement.style.top = `${y}px`;
      });

      setMousePosition({ x, y });
    };

    section.addEventListener('mouseenter', handleMouseEnter);
    section.addEventListener('mouseleave', handleMouseLeave);
    section.addEventListener('mousemove', handleMouseMove);

    return () => {
      section.removeEventListener('mouseenter', handleMouseEnter);
      section.removeEventListener('mouseleave', handleMouseLeave);
      section.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (!isMounted) {
    return (
      <div
        className="w-full max-w-7xl mx-auto py-20 px-4 bg-gradient-to-b from-indigo-900 to-purple-900 text-white"
        style={{ minHeight: '500px' }}
      >
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 bg-indigo-800 rounded-lg p-6 shadow-lg">
            <div className="text-2xl font-bold mb-6">motia</div>
            <nav className="space-y-4">
              {[
                'Overview',
                'Integrations',
                'Activity',
                'Domains',
                'Usage',
                'Monitoring',
                'Observability',
                'Storage',
              ].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>
            <div className="mt-6 space-y-4">
              <div className="bg-indigo-900 p-4 rounded-md">
                <div className="text-sm font-medium text-gray-300">update_python_runner</div>
                <div className="flex justify-between items-center mt-2">
                  <button className="text-blue-400 text-sm">Preview</button>
                  <div className="flex space-x-2">
                    <span className="text-gray-400 text-xs">0</span>
                    <span className="text-gray-400 text-xs">109</span>
                    <span className="text-gray-400 text-xs">393</span>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-900 p-4 rounded-md">
                <div className="text-sm font-medium text-gray-300">update_docs</div>
                <div className="flex justify-between items-center mt-2">
                  <button className="text-blue-400 text-sm">Preview</button>
                  <div className="flex space-x-2">
                    <span className="text-gray-400 text-xs">0</span>
                    <span className="text-gray-400 text-xs">106</span>
                    <span className="text-gray-400 text-xs">393</span>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-900 p-4 rounded-md">
                <div className="text-sm font-medium text-gray-300">chore: update snap</div>
                <div className="flex justify-between items-center mt-2">
                  <button className="text-blue-400 text-sm">Preview</button>
                  <div className="flex space-x-2">
                    <span className="text-gray-400 text-xs">0</span>
                    <span className="text-gray-400 text-xs">99</span>
                    <span className="text-gray-400 text-xs">ggw0x</span>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-900 p-4 rounded-md">
                <div className="text-sm font-medium text-gray-300">feat: save_flow_cor</div>
                <div className="flex justify-between items-center mt-2">
                  <button className="text-blue-400 text-sm">Preview</button>
                  <div className="flex space-x-2">
                    <span className="text-gray-400 text-xs">0</span>
                    <span className="text-gray-400 text-xs">87</span>
                    <span className="text-gray-400 text-xs">mf03x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3 flex flex-col items-center text-center">
            <span className="inline-block bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
              Coming soon
            </span>
            <Typography
              variant="title"
              as="h2"
              className="text-4xl font-bold mb-4 text-white"
            >
              Scale with MotiaHub
            </Typography>
            <Typography
              variant="description"
              as="p"
              className="text-lg mb-8 text-gray-300 max-w-2xl"
            >
              Production-ready workflows without the infrastructure overhead.
            </Typography>
            <div className="w-full max-w-md">
              <BetaAccessForm handleSubmit={handleSubmit} state={formState} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className="w-full max-w-7xl mx-auto py-20 px-4 relative overflow-hidden bg-gradient-to-b from-indigo-900 to-purple-900 text-white"
      style={{ minHeight: '500px' }}
    >
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isHovering ? 'opacity-20' : 'opacity-0'
          }`}
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          transform: isHovering ? 'scale(1.05)' : 'scale(0.9)',
          transition: 'opacity 1000ms ease, transform 1000ms ease',
        }}
      />

      <div
        ref={glowRef}
        className={`absolute pointer-events-none ${isHovering ? 'opacity-100' : 'opacity-0'}`}
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          transition: 'opacity 0.5s ease',
          mixBlendMode: 'soft-light',
          filter: 'blur(8px)',
          willChange: 'left, top',
        }}
      />

      <div className="flex flex-col md:flex-row gap-8 relative z-10">
        {/* Left Sidebar */}
        <div className="w-full md:w-1/3 bg-indigo-800 rounded-lg p-6 shadow-lg">
          <div className="text-2xl font-bold mb-6 flex items-center gap-2 text-purple-200"> {/* Logo container */}
            <img src="/logos/logo-white.svg" alt="Motia Icon" className="h-6 w-auto mr-1" /> {/* Motia Icon */}
            motia <span className="text-lg font-semibold text-purple-300">Hub</span>
          </div>
          <nav className="space-y-2"> {/* Reduced space-y */}
            {[
              'Overview',
              'Integrations',
              'Activity',
              'Domains',
              'Usage',
              'Monitoring',
              'Observability',
              'Storage',
            ].map((item) => (
              <a
                key={item}
                href="#"
                className="block text-gray-300 hover:text-white transition-colors hover:pl-2 relative group text-sm"
              >
                {item}
                <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-4 h-4 text-purple-500" />
              </a>
            ))}
          </nav>
          <div className="mt-6 space-y-3"> {/* Reduced mt and space-y */}
            {/* Update List */}
            <div className="bg-indigo-900 p-3 rounded-md hover:bg-indigo-900/90 transition-colors">
              <div className="text-sm font-medium text-gray-300 mb-0.5">update_python_runner</div>
              <div className="flex justify-between items-center mt-0 text-gray-400 text-xs">
                <button className="text-blue-400 text-sm hover:underline">Preview</button>
                <div className="flex space-x-2 font-mono text-gray-500">
                  <span>0</span>
                  <span>109</span>
                  <span>393</span>
                </div>
              </div>
            </div>
            <div className="bg-indigo-900 p-3 rounded-md hover:bg-indigo-900/90 transition-colors">
              <div className="text-sm font-medium text-gray-300 mb-0.5">update_docs</div>
              <div className="flex justify-between items-center mt-0 text-gray-400 text-xs">
                <button className="text-blue-400 text-sm hover:underline">Preview</button>
                <div className="flex space-x-2 font-mono text-gray-500">
                  <span>0</span>
                  <span>106</span>
                  <span>393</span>
                </div>
              </div>
            </div>
            <div className="bg-indigo-900 p-3 rounded-md hover:bg-indigo-900/90 transition-colors">
              <div className="text-sm font-medium text-gray-300 mb-0.5">chore: update snap</div>
              <div className="flex justify-between items-center mt-0 text-gray-400 text-xs">
                <button className="text-blue-400 text-sm hover:underline">Preview</button>
                <div className="flex space-x-2 font-mono text-gray-500">
                  <span>0</span>
                  <span>99</span>
                  <span>ggw0x</span>
                </div>
              </div>
            </div>
            <div className="bg-indigo-900 p-3 rounded-md hover:bg-indigo-900/90 transition-colors">
              <div className="text-sm font-medium text-gray-300 mb-0.5">feat: save_flow_cor</div>
              <div className="flex justify-between items-center mt-0 text-gray-400 text-xs">
                <button className="text-blue-400 text-sm hover:underline">Preview</button>
                <div className="flex space-x-2 font-mono text-gray-500">
                  <span>0</span>
                  <span>87</span>
                  <span>mf03x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-full md:w-2/3 flex flex-col items-center text-center">
          <span className="inline-block bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
            Coming soon
          </span>
          <Typography
            variant="title"
            as="h2"
            className="text-4xl font-bold mb-4 text-white"
          >
            Scale with MotiaHub
          </Typography>
          <Typography
            variant="description"
            as="p"
            className="text-lg mb-8 text-gray-300 max-w-2xl"
          >
            Production-ready workflows without the infrastructure overhead.
          </Typography>

          <div className="w-full max-w-md">
            <BetaAccessForm handleSubmit={handleSubmit} state={formState} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotiaHubSection;