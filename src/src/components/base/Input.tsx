
interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  name,
  required = false,
  disabled = false
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      required={required}
      disabled={disabled}
      className={`w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent outline-none transition-all duration-200 ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`}
    />
  );
}
