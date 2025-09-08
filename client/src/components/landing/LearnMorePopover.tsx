import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function LearnMorePopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="text-lg px-8 py-3 bg-transparent"
        >
          Learn More
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">What is Whisprr?</h4>
            <p className="text-sm text-muted-foreground">
              Whisprr is an anonymous peer support platform where you can
              connect with verified counselors and supportive peers without
              revealing your identity.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
