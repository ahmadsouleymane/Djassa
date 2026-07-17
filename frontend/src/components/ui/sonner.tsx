import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-border !bg-card !text-foreground !shadow-[var(--shadow-lg)] !font-sans",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground !rounded-lg",
          cancelButton: "!bg-secondary !text-foreground !rounded-lg",
          success: "!text-foreground",
          error: "!text-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
