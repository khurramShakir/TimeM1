import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <SignIn appearance={{
                elements: {
                    formButtonPrimary: 'bg-green-600 hover:bg-green-700 text-sm normal-case',
                }
            }} />
        </div>
    );
}
