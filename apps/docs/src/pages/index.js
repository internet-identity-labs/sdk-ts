import { useEffect } from 'react';
import versions from '../../versions.json';

export default function Home() {
  useEffect(() => {
    window.location.href = `/${versions[0]}/welcome`;
  }, []);

  return <div />;
}
