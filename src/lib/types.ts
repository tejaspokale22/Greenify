export interface Report {
    id: number;
    userId: string;
    location: string;
    wasteType: string;
    amount: string;
    imageUrl: string | null;
    verificationResult: unknown;
    status: string;
    createdAt: Date;
    collectorId: string | null;
}           

export interface User {
    id: string;
    clerkId: string;
    email: string;
    fullName: string;
    profileImage: string;
}
