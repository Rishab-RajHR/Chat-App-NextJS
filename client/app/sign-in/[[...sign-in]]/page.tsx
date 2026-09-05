import { SignIn } from "@clerk/nextjs";


export default function SignInPage(){
     return <div className="flex items-center justify-center min-h-screen  bg-gray-900 p-4">
          <div className="w-full max-w-md">
     <SignIn 
          routing="hash"
          signInUrl="/sign-up"
          appearance={{
        elements: {
          rootBox: "w-full",
          card: "bg-gray-800 shadow-2xl rounded-2xl",
          headerTitle: "text-white text-2xl",
          headerSubtitle: "text-gray-400",
          socialButtonsBlockButton:
            "bg-gray-700 hover:bg-gray-600 text-white border-gray-600",
          socialButtonsBlockButtonText: "text-white",
          dividerLine: "bg-gray-700",
          dividerText: "text-gray-500",
          formFieldLabel: "text-gray-300",
          formFieldInput:
            "bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500",
          formFieldInputShowPasswordButton: "text-gray-400",
          formButtonPrimary:
            "bg-blue-600 hover:bg-blue-700 text-white",
          footerActionText: "text-gray-400",
          footerActionLink:
            "text-blue-400 hover:text-blue-300",
          identityPreviewText: "text-white",
          identityPreviewEditButton:
            "text-blue-400 hover:text-blue-300",
          otpCodeFieldInput:
            "bg-gray-700 text-white border-gray-600",
          backupCodeFieldInput:
            "bg-gray-700 text-white border-gray-600",
          alert: "bg-red-900/50 text-red-200 border-red-800",
          alertText: "text-red-200",
        },
      }}
     />
     </div>
    </div> 
}