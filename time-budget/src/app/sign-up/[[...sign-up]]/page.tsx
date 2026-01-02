import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <SignUp appearance={{
                elements: {
                    formButtonPrimary: 'bg-green-600 hover:bg-green-700 text-sm normal-case',
                }
            }} />
        </div>
    );
}
