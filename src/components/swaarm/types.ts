export interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string;
  social: string;
  photo: string;
  finalImage: string;
  createdAt: string;
  helmetVariant: string;
  status: 'completed' | 'processing';
  emailSent: boolean;
}

export type ViewKey = 'landing' | 'form' | 'capture' | 'processing' | 'result' | 'admin';

export interface FormData {
  name: string;
  email: string;
  phone: string;
  social: string;
  photo: string;
}
