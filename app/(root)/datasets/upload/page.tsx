"use client"

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileAudio, FileText, ImageIcon, UploadIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner'

const Upload = () => {
  const [taskType, setTaskType] = useState("");
  const [dataType, setDataType] = useState("");

  const handleDataTypeChange = (type: string) => {
    setDataType(type);
    setTaskType("");
  };

  const handleUpload = () => {
    toast.success("Dataset uploadé !", {
      description: "Votre dataset a été ajouté avec succès.",
    });
  };

  return (
    <div className='flex flex-col w-full min-h-screen'>
      <div className='top-0 z-10 flex w-full px-6 items-center py-3 border-b rounded-md bg-white/70 dark:bg-zinc-900/70'>
        <div>
          <h1 className='font-bold text-[25px]'>Uploader un{" "}
            <span className='text-secondary'>dataset</span>
          </h1>
          <p className='text-[14px] text-muted-foreground'>Centralisez vos données et préparez-les pour l'annotation</p>
        </div>
      </div>

      <div className='flex-1 p-6'>
        <div className="grid gap-6">

          <Card className="p-6 bg-card border-border">
            <h2 className="text-xl font-semibold mb-4">1. Choisissez le type de tâche</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card
                className={`p-4 cursor-pointer transition-all hover:shadow-card ${
                  dataType === "speech" ? "bg-primary text-white" : ""
                }`}
                onClick={() => handleDataTypeChange("speech")}
              >
                <FileAudio className={`h-8 w-8 text-primary mb-2 ${dataType === "speech"? "text-secondary":""}`} />
                <h3 className="font-semibold">Speech / Audio</h3>
                <p className="text-sm text-muted-foreground mt-1">TTS, STT, Speaker ID</p>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-all hover:shadow-card ${
                  dataType === "text" ? "bg-primary text-white" : ""
                }`}
                onClick={() => handleDataTypeChange("text")}
              >
                <FileText className={`h-8 w-8 text-primary mb-2 ${dataType === "text"? "text-secondary":""}`}/>
                <h3 className="font-semibold">Traduction</h3>
                <p className="text-sm text-muted-foreground mt-1">Multilingue, dialectes</p>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-all hover:shadow-card ${
                  dataType === "image" ? "bg-primary text-white" : ""
                }`}
                onClick={() => handleDataTypeChange("image")}
              >
                <ImageIcon className={`h-8 w-8 text-primary mb-2 ${dataType === "image"? "text-secondary":""}`} />
                <h3 className="font-semibold">Images</h3>
                <p className="text-sm text-muted-foreground mt-1">Classification, OCR</p>
              </Card>
            </div>
          </Card>

          {dataType && (
            <Card className="p-6 bg-card border-border animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">2. Sélectionnez la sous-tâche</h2>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une sous-tâche..." />
                </SelectTrigger>
                <SelectContent>
                  {dataType === "speech" && (
                    <>
                      <SelectItem value="tts">Text-to-Speech (TTS)</SelectItem>
                      <SelectItem value="stt">Speech-to-Text (STT)</SelectItem>
                      <SelectItem value="speaker-id">Speaker Identification</SelectItem>
                      <SelectItem value="emotion">Emotion Recognition</SelectItem>
                    </>
                  )}
                  {dataType === "text" && (
                    <>
                      <SelectItem value="translation">Traduction multilingue</SelectItem>
                      <SelectItem value="dialect">Dialecte ↔ Standard</SelectItem>
                      <SelectItem value="alignment">Alignement de phrases</SelectItem>
                    </>
                  )}
                  {dataType === "image" && (
                    <>
                      <SelectItem value="classification">Classification</SelectItem>
                      <SelectItem value="detection">Détection d'objets</SelectItem>
                      <SelectItem value="ocr">OCR</SelectItem>
                      <SelectItem value="description">Description visuelle</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </Card>
          )}

          {taskType && (
            <Card className="p-6 bg-card border-border animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">3. Informations du dataset</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du dataset</Label>
                  <Input id="name" placeholder="Ex: Wolof Speech Corpus 2025" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre dataset..."
                    rows={4}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Langue(s)</Label>
                    <Input id="language" placeholder="Ex: Wolof, Français" />
                  </div>
                  <div>
                    <Label htmlFor="size">Taille estimée</Label>
                    <Input id="size" placeholder="Ex: 10 GB, 5000 fichiers" />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {taskType && (
            <Card className="p-6 bg-card border-border animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">4. Uploadez vos fichiers</h2>
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Cliquez pour sélectionner ou glissez vos fichiers ici
                </p>
                <p className="text-sm text-muted-foreground">
                  Formats supportés:{" "}
                  {dataType === "speech" && "WAV, MP3, M4A"}
                  {dataType === "text" && "TXT, CSV, JSON"}
                  {dataType === "image" && "JPG, PNG, WEBP"}
                </p>
              </div>
            </Card>
          )}

          {taskType && (
            <div className="flex justify-end gap-4 animate-fade-in">
              <Button variant="outline">Annuler</Button>
              <Button size="lg" onClick={handleUpload} className='hover:bg-secondary'>
                Uploader le dataset
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Upload