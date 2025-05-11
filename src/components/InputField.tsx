import { FieldError } from "react-hook-form";

type InputFieldProps = {
  label: String;
  type?: String;
  register: any;
  name: String;
  defaultValue?: String;
  error?: FieldError;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  inputProps,
}: InputFieldProps) => {
  return (
    <div className="flex flex-col gap-2 w-full md:w-1/2">
      <label className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <input
        type={type}
        {...register(name)}
        className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        {...inputProps}
        defaultValue={defaultValue}
      />
      {error?.message && (
        <p className="text-xs text-red-400 dark:text-red-400">
          {error?.message.toString()}
        </p>
      )}
    </div>
  );
};

export default InputField;
