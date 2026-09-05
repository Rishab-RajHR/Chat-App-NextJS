'use client';

import {  UserButton, useUser } from "@clerk/nextjs";
import SignInPage from "./sign-in/[[...sign-in]]/page";


export default function Page() {
    const { isSignedIn, user, isLoaded } = useUser()

    if(!isLoaded) return <div>Loading...</div>

    if (!isSignedIn) return <SignInPage />
   

    return <div>Hello 
        <div>
            <UserButton />
        </div>
    </div>
}