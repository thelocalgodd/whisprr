"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { User, Heart, Recycle } from "lucide-react";
import { cn } from "@/lib/utils";
import generateAnonymousUsername from "@/utils/generate-username";
import { Register as RegisterService } from "@/services/auth";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z
  .object({
    username: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    role: z.enum(["user", "counselor"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

function Register() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      role: "user",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log(data);
    try {
      const response = await RegisterService(
        data.username,
        data.password,
        data.role
      );
      console.log(response);
      toast.success("Registration successful");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Registration failed, Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>Create your account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Your username" {...field} />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const randomUsername = generateAnonymousUsername();
                          field.onChange(randomUsername);
                        }}
                      >
                        <Recycle className="w-4 h-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="********"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="********"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Select your role</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem
                              value="user"
                              id="user"
                              className="sr-only"
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor="user"
                            className={cn(
                              "flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                              field.value === "user" && "border-primary"
                            )}
                          >
                            <User className="mb-3 h-6 w-6" />
                            User
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem
                              value="counselor"
                              id="counselor"
                              className="sr-only"
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor="counselor"
                            className={cn(
                              "flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                              field.value === "counselor" && "border-primary"
                            )}
                          >
                            <Heart className="mb-3 h-6 w-6" />
                            Counselor
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign Up
              </Button>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                  Sign in
                </Link>
              </div>
              <div className="mt-4 text-center text-[10px] text-red-400 px-4 bg-red-100 rounded-md">
                please do not use any personally identifiable information on
                this site
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Register;
