import * as React from "react";
import { ChevronDown, Check } from "lucide-react";

const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <div className={`relative ${className || ""}`} ref={ref} {...props}>
    {children}
  </div>
));

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <button
    className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
    ref={ref}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
));

const SelectValue = React.forwardRef(({ className, placeholder, ...props }, ref) => (
  <span className={`block truncate ${className || ""}`} ref={ref} {...props}>
    {props.children || (
      <span className="text-slate-500">{placeholder}</span>
    )}
  </span>
));

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => {
  return (
    <div
      className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md ${className || ""}`}
      ref={ref}
      {...props}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  );
});

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className || ""}`}
    ref={ref}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {/* Add check icon for selected items if needed */}
    </span>
    {children}
  </div>
));

// Simple implementation for this demo - in production you'd want a more robust dropdown
const SelectProvider = ({ children, value, onValueChange }) => {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value);

  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelect = (newValue) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            onClick: () => setOpen(!open),
            children: React.Children.map(child.props.children, subChild => {
              if (subChild.type === SelectValue) {
                const selectedItem = React.Children.toArray(
                  React.Children.map(children, c => c.type === SelectContent ? c.props.children : null)
                ).flat().find(item => item?.props?.value === selectedValue);
                
                return React.cloneElement(subChild, {
                  children: selectedItem ? selectedItem.props.children : subChild.props.placeholder
                });
              }
              return subChild;
            })
          });
        }
        
        if (child.type === SelectContent && open) {
          return (
            <div className="absolute top-full left-0 w-full z-50 mt-1">
              {React.cloneElement(child, {
                children: React.Children.map(child.props.children, item => {
                  if (item.type === SelectItem) {
                    return React.cloneElement(item, {
                      onClick: () => handleSelect(item.props.value),
                      className: `${item.props.className || ""} cursor-pointer`
                    });
                  }
                  return item;
                })
              })}
            </div>
          );
        }
        
        return null;
      })}
      
      {open && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
};

// Export with provider wrapper
export { SelectProvider as Select, SelectTrigger, SelectValue, SelectContent, SelectItem };