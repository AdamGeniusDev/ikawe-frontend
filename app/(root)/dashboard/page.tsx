import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const Dashboard = () => {
  return (
    <div className='flex flex-col w-full min-h-screen'>
      
      <div className=' top-0 z-10 flex w-full px-6 items-center justify-between py-3 border-b rounded-md bg-white/70 dark:bg-zinc-900/70'>
        <div>
          <h1 className='font-bold text-[25px]'>Dashboard</h1>
          <p className='text-[14px] text-muted-foreground'>Bienvenue sur votre dashboard Jean</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline'>Téleverser</Button>
          <Button className='bg-secondary gap-1'>
            <Plus size={16} />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Contenu de la page */}
      <div className='flex-1 p-6'>
        {/* ... */}
      </div>

    </div>
  )
}

export default Dashboard