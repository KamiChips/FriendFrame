import '../../global.css';
import { Button } from '@/components/ui/Button';

<style>
@import url('https://fonts.googleapis.com/css2?family=Borel&display=swap');
</style>

export default function HomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-[#FAFAFA] via-[#30C2D9] to-[#FF9B42]">
        <h1 className="text-4xl font-bold mb-40 font">FriendFrame</h1>

        <Button title="Get Started" onPress={() => {}} variant='secondary' />

        <Button title="Have an Account?" onPress={() => {}} variant='primary'/>

    </div>
  );
}