import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function CrisisSupportPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700">
          Learn About Crisis Support
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">24/7 Crisis Support</h4>
            <p className="text-sm text-muted-foreground">
              Our panic button instantly connects you to professional crisis
              hotlines. Help is always just one click away.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
