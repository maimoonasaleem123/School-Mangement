"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LoginPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  const router = useRouter();

  useEffect(() => {
    const role = user?.publicMetadata.role;

    if (role) {
      router.push(`/${role}`);
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white px-4">
      <div className="max-w-4xl w-full mx-auto">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

          {/* Left marketing / illustration panel */}
          <div className="hidden md:flex flex-col justify-center gap-4 p-10 bg-gradient-to-br from-indigo-600 to-sky-500 text-white">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="logo" width={36} height={36} />
              <h3 className="text-2xl font-semibold">School Management</h3>
            </div>
            <h2 className="text-lg font-medium">Welcome back</h2>
            <p className="text-sm opacity-90 max-w-xs">Manage students, classes, assignments and results — all in one place. Sign in to continue to your dashboard.</p>
            <div className="mt-4 text-sm opacity-90">Tip: Use your school credentials to login.</div>
          </div>

          {/* Right: Sign-in form */}
          <div className="p-8 md:p-10">
            <SignIn.Root>
              <SignIn.Step name="start">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="logo" width={28} height={28} />
                    <div>
                      <div className="text-lg font-bold">School Management System</div>
                      <div className="text-xs text-gray-500">Sign in to your account</div>
                    </div>
                  </div>

                  <Clerk.GlobalError className="text-sm text-red-500" />

                  <Clerk.Field name="identifier" className="flex flex-col gap-1">
                    <Clerk.Label className="text-xs text-gray-600">Username or Email</Clerk.Label>
                    <Clerk.Input className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300" />
                    <Clerk.FieldError className="text-xs text-red-500" />
                  </Clerk.Field>

                  <Clerk.Field name="password" className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <Clerk.Label className="text-xs text-gray-600">Password</Clerk.Label>
                     
                    </div>
                    <Clerk.Input type="password" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300" />
                    <Clerk.FieldError className="text-xs text-red-500" />
                  </Clerk.Field>

                  <SignIn.Action submit className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-md py-2 text-sm font-medium">Sign In</SignIn.Action>

           

            

                  <div className="text-xs text-gray-500 text-center pt-2">Need an account? Contact your administrator.</div>
                </div>
              </SignIn.Step>
            </SignIn.Root>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
