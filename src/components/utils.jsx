// This helper function is used to conditionally join class names
export function cn(...args) {
  return args.filter(Boolean).join(" ");
}