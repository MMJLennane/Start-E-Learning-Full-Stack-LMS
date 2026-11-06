import "./button.css";

const variantClassNames = {
  primary: "button-primary",
  outline: "button-outline",
  quiet: "button-quiet",
  text: "text-button",
};

export default function Button({
  children,
  className = "",
  fullWidth = false,
  type = "button",
  variant = "primary",
  ...props
}) {
  const variantClassName = variantClassNames[variant] ?? "button-primary";
  const classes = [
    "button",
    variantClassName,
    fullWidth ? "full-width" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
