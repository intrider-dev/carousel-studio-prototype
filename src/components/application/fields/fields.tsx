import type { ComponentProps, InputHTMLAttributes } from "react";
import { InputBase } from "@/components/base/input/input";
import { InputFile } from "@/components/base/input/input-file";
import { TextAreaBase } from "@/components/base/textarea/textarea";

// Keep native change events for the editor's numeric fields and file validation.
export function Input({
  className,
  disabled,
  required,
  onChange,
  type,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size">) {
  if (type === "file")
    return (
      <InputFile
        size="md"
        className={className}
        isDisabled={disabled}
        isRequired={required}
        acceptedFileTypes={props.accept?.split(",")}
        allowsMultiple={props.multiple}
        placeholder="Файл не выбран"
        buttonText="Выбрать"
        inputProps={props}
        onInputChange={onChange}
      />
    );
  if (type === "color") return <div className="flex min-w-0 items-center gap-2">
    <InputBase {...props} type="color" disabled={disabled} isDisabled={disabled}
      onChange={onChange} inputClassName="h-10 w-10 shrink-0 p-1" wrapperClassName="w-10 shrink-0" />
    <InputBase aria-label="Код выбранного цвета" value={String(props.value ?? '')} readOnly disabled={disabled} isDisabled={disabled} />
  </div>;
  return (
    <InputBase
      {...props}
      type={type}
      disabled={disabled}
      isDisabled={disabled}
      isRequired={required}
      onChange={onChange}
      inputClassName={className}
      isInvalid={
        props["aria-invalid"] === true || props["aria-invalid"] === "true"
      }
    />
  );
}
export function Textarea(props: ComponentProps<typeof TextAreaBase>) {
  return <TextAreaBase {...props} />;
}
