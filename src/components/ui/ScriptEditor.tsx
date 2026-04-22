"use client";

interface ScriptEditorProps {
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  placeholder?: string;
}

export function ScriptEditor({
  value,
  onChange,
  placeholder = "echo 'hello world'",
}: ScriptEditorProps) {
  const text = Array.isArray(value) ? value.join("\n") : (value ?? "");

  const handleChange = (raw: string) => {
    const lines = raw.split("\n");
    onChange(lines.length > 1 ? lines : raw);
  };

  return (
    <textarea
      className="w-full px-2.5 py-2 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded resize-y min-h-[60px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none leading-5"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      rows={Math.max(2, text.split("\n").length)}
    />
  );
}
