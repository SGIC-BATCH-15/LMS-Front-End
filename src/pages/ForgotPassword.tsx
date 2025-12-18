import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import axios from 'axios';
import { API_BASE_URL } from '@/constants/Api';

export const ForgotPassword: React.FC = () => {
    const [step, setStep] = useState<'EMAIL' | 'OTP' | 'RESET' | 'SUCCESS'>('EMAIL');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try{
            await axios.post(`${API_BASE_URL}/auth/otp`, 
                {email:email.trim()});

                toast.success('OTP code sent to your email Successfully',{
                    description: 'Please check your email for the verification code.',
                });
                setStep('OTP');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err:any) {
            const message = err.response?.data?.message || 'Failed to send OTP code. Please try again.';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try{
            await axios.post(`${API_BASE_URL}/auth/otp/verify`,{
                email:email.trim(),
                otp:otp
            });

            toast.success('OTP verified successfully');
            setStep('RESET');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err:any) {
            const message = err.response?.data?.message || 'Invalid OTP code. Please try again.';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) { // Matches backend validation in AuthenticationService
            setError('Password length must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await axios.put(`${API_BASE_URL}/auth/update`, {
                email: email.trim(),
                newPassword: newPassword,
                confirmPassword: confirmPassword
            });

            toast.success('Password reset successfully');
            setStep('SUCCESS');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to reset password. Please try again.';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'EMAIL':
                return (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending code...</> : 'Send Code'}
                        </Button>
                    </form>
                );

            case 'OTP':
                return (
                    <form onSubmit={handleOtpSubmit} className="space-y-4">
                        <div className="space-y-4 flex flex-col items-center">
                            <Label htmlFor="otp">Enter Verification Code</Label>

                            <InputOTP
                                maxLength={6}
                                value={otp}
                                onChange={(value) => setOtp(value)}
                                disabled={isLoading}
                            >
                                <div className="flex gap-2">
                                    <InputOTPGroup><InputOTPSlot index={0} /></InputOTPGroup>
                                    <InputOTPGroup><InputOTPSlot index={1} /></InputOTPGroup>
                                    <InputOTPGroup><InputOTPSlot index={2} /></InputOTPGroup>
                                    <InputOTPGroup><InputOTPSlot index={3} /></InputOTPGroup>
                                    <InputOTPGroup><InputOTPSlot index={4} /></InputOTPGroup>
                                    <InputOTPGroup><InputOTPSlot index={5} /></InputOTPGroup>
                                </div>
                            </InputOTP>

                            <p className="text-xs text-muted-foreground text-center">
                                Code sent to <span className="font-medium text-foreground">{email}</span>
                            </p>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={isLoading || otp.length !== 6} 
                            size="lg"
                        >
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify Code'}
                        </Button>

                        <Button 
                            variant="link" 
                            type="button" 
                            className="w-full" 
                            onClick={() => {
                                setStep('EMAIL');
                                setOtp('');
                            }}
                        >
                            Change Email
                        </Button>
                    </form>
                );

            case 'RESET':
                return (
                    <form onSubmit={handleResetSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</> : 'Reset Password'}
                        </Button>
                    </form>
                );

            case 'SUCCESS':
                return (
                    <div className="text-center space-y-4">
                        <Alert className="bg-green-50 text-green-700 border-green-200">
                            <AlertDescription>
                                Your password has been successfully reset. You can now login with your new password.
                            </AlertDescription>
                        </Alert>
                        <Button 
                            className="w-full" 
                            size="lg"
                            onClick={() => navigate('/login')}
                        >
                            Proceed to Login
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
            <Card className="w-full w-[450px] min-h-[520px] shadow-xl flex flex-col justify-center">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <KeyRound className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {step === 'EMAIL' && 'Forgot Password?'}
                        {step === 'OTP' && 'Verify OTP'}
                        {step === 'RESET' && 'Reset Password'}
                        {step === 'SUCCESS' && 'Password Reset!'}
                    </CardTitle>
                    <CardDescription className="text-base">
                        {step === 'EMAIL' && 'Enter your email to receive a verification code'}
                        {step === 'OTP' && 'Enter the code sent to your email'}
                        {step === 'RESET' && 'Create a strong new password'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {renderStep()}

                    {step === 'EMAIL' && (
                        <>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
