import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useAccentColor } from "@/contexts/AccentColorContext";

const colors = [
  { name: 'Blue', hex: 'var(--blue-9)', accentColor: 'blue' },
  { name: 'Brown', hex: 'var(--brown-9)', accentColor: 'brown' },
  { name: 'Crimson', hex: 'var(--crimson-9)', accentColor: 'crimson' },
  { name: 'Cyan', hex: 'var(--cyan-9)', accentColor: 'cyan' },
  { name: 'Gold', hex: 'var(--gold-9)', accentColor: 'gold' },
  { name: 'Green', hex: 'var(--green-9)', accentColor: 'green' },
  { name: 'Indigo', hex: 'var(--indigo-9)', accentColor: 'indigo' },
  { name: 'Pink', hex: 'var(--pink-9)', accentColor: 'pink' },
  { name: 'Plum', hex: 'var(--plum-9)', accentColor: 'plum' },
  { name: 'Purple', hex: 'var(--purple-9)', accentColor: 'purple' },
  { name: 'Red', hex: 'var(--red-9)', accentColor: 'red' },
  { name: 'Teal', hex: 'var(--teal-9)', accentColor: 'teal' },
  { name: 'Tomato', hex: 'var(--tomato-9)', accentColor: 'tomato' },
  { name: 'Violet', hex: 'var(--violet-9)', accentColor: 'violet' },
  { name: 'Amber', hex: 'var(--amber-9)', accentColor: 'amber' },
  { name: 'Ruby', hex: 'var(--ruby-9)', accentColor: 'ruby' },
  { name: 'Jade', hex: 'var(--jade-9)', accentColor: 'jade' },
  { name: 'Grass', hex: 'var(--grass-9)', accentColor: 'grass' },
];

const DemoSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setAccentColor } = useAccentColor();
  const [isColorSelected, setIsColorSelected] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleColorChange = (color: string) => {
    setAccentColor(color);
    setIsColorSelected(true);
  };

  const handleReset = () => {
    setAccentColor('orange');
    setIsColorSelected(false);
  };

  return (
    <div>
      <button 
        onClick={toggleSidebar}
        type="button"
        className="fixed right-4 bottom-4 z-50 p-2 bg-neutral-600 text-white rounded-full cursor-pointer"
      >
        <Settings size={20} className="animate-spin" />
      </button>
      <div 
        className={`z-50 fixed right-0 bottom-14 rounded-lg w-64 bg-gray-800 text-white shadow-lg transition-transform transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="font-bold">Brand Color Demo</h2>
          <X size={20} className="cursor-pointer" onClick={toggleSidebar} />
        </div>
        <div className="p-4">
          <p className="text-sm mb-2">Select a color:</p>
          <div className="space-x-2">
            {colors.map((color) => (
              <span 
                key={color.name} 
                onClick={() => handleColorChange(color.accentColor)} 
                className="w-10 h-10 inline-block cursor-pointer" 
                style={{ backgroundColor: color.hex, borderRadius: '4px' }}
              />
            ))}
          </div>
          <button 
            onClick={handleReset} 
            disabled={!isColorSelected} 
            className={`text-sm mt-4 px-2 py-1 rounded ${isColorSelected ? 'bg-neutral-500 text-white cursor-pointer' : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'}`}
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoSidebar;
