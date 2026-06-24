import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      offset={88}
      visibleToasts={3}
      toastOptions={{
        duration: 3500,
        classNames: {
          toast:
            "group toast glass !rounded-lg !border-border/50 !text-foreground",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-muted !text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { toast } from "sonner";
