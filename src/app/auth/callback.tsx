import { Redirect } from 'expo-router';
import { useAuth } from '../../auth/session';

export default function Callback() {
  const { profile } = useAuth();
  return <Redirect href={profile ? '/dashboard' : '/'} />;
}
