import React, { useState, ReactNode } from 'react';


type CloneProps = { activeTab?: string; setActiveTab?: (v: string) => void; value?: string };

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, children, className }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<CloneProps>(child)) return null;
        if (child.type === TabsList)
          return React.cloneElement(child, { activeTab, setActiveTab });
        if (child.type === TabsContent && child.props.value === activeTab)
          return child;
        return null;
      })}
    </div>
  );
};

export const TabsList: React.FC<{ children: ReactNode; activeTab?: string; setActiveTab?: (value: string) => void }> = ({
  children,
  activeTab,
  setActiveTab,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    );
    const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = tabs[(currentIndex + 1) % tabs.length];
      next.focus();
      setActiveTab?.(next.dataset.value!);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
      prev.focus();
      setActiveTab?.(prev.dataset.value!);
    } else if (e.key === 'Home') {
      e.preventDefault();
      tabs[0].focus();
      setActiveTab?.(tabs[0].dataset.value!);
    } else if (e.key === 'End') {
      e.preventDefault();
      tabs[tabs.length - 1].focus();
      setActiveTab?.(tabs[tabs.length - 1].dataset.value!);
    }
  };

  return (
    <div role="tablist" className="flex gap-2" onKeyDown={handleKeyDown}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<CloneProps>(child)) return null;
        return React.cloneElement(child, { activeTab, setActiveTab });
      })}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps & { activeTab?: string; setActiveTab?: (value: string) => void }> = ({
  value,
  children,
  activeTab,
  setActiveTab,
}) => (
  <button
    role="tab"
    id={`tab-trigger-${value}`}
    aria-selected={activeTab === value}
    aria-controls={`tab-panel-${value}`}
    tabIndex={activeTab === value ? 0 : -1}
    data-value={value}
    onClick={() => setActiveTab?.(value)}
    className={`px-4 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${activeTab === value ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
  >
    {children}
  </button>
);

export const TabsContent: React.FC<TabsContentProps> = ({ value, children }) => (
  <div
    role="tabpanel"
    id={`tab-panel-${value}`}
    aria-labelledby={`tab-trigger-${value}`}
    tabIndex={0}
  >
    {children}
  </div>
);
