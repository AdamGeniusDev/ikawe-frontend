"use client"

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Check, FileAudio, FileText, ImageIcon, Pause, Play,SkipForward, Sparkles } from 'lucide-react'
import Image from 'next/image';
import { useState } from 'react';
import {toast} from 'sonner'

const Annotate = () => {

  const [annotationType, setAnnotationType] = useState("manual");
  const [dataType, setDataType] = useState<"audio" | "text" | "image" | null>(
    null
  );
  const [currentItem, setCurrentItem] = useState(1);
  const totalItems = 50;
  const progress = (currentItem / totalItems) * 100;

  const handleNext = () => {
    if (currentItem < totalItems) {
      setCurrentItem(currentItem + 1);
      toast.success("Annotation sauvegardée", {
        description: `Item ${currentItem} annoté avec succès`,
      });
    }
  };

  const handleAutoAnnotate = () => {
    toast.info("Annotation automatique lancée", {
      description: "L'IA annote vos données en arrière-plan...",
    });
  };

  return (
    <div className='flex flex-col w-full min-h-screen'>
      
      <div className='rounded-md top-0 z-10 flex w-full px-6 items-center py-3 border-b bg-white/70 dark:bg-zinc-900/70'>
        <div>
          <h1 className='font-bold text-[25px]'>Annoter un {" "}
            <span className='text-secondary'>dataset</span>
          </h1>
          <p className='text-[14px] text-muted-foreground'>Enrichissez vos données avec des annotations précises</p>
        </div>
      </div>

      <div className='flex-1 p-6'>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Zone principale d'annotation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Type d'annotation */}
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-semibold mb-4">
                  Type d'annotation
                </h2>
                <Tabs value={annotationType} onValueChange={setAnnotationType}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="manual">Manuelle</TabsTrigger>
                    <TabsTrigger value="auto">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Auto (IA)
                    </TabsTrigger>
                    <TabsTrigger value="hybrid">Hybride</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Annotez manuellement chaque élément avec vos propres
                      labels
                    </p>
                  </TabsContent>

                  <TabsContent value="auto" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      L'IA annote automatiquement vos données. Vous pouvez
                      réviser après.
                    </p>
                    <Button onClick={handleAutoAnnotate}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Lancer l'annotation automatique
                    </Button>
                  </TabsContent>

                  <TabsContent value="hybrid" className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      L'IA pré-annote, vous validez et corrigez si nécessaire
                    </p>
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Visualisation des données */}
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-semibold mb-4">
                  Données à annoter
                </h2>

                {dataType === null ? (
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Sélectionnez le type de données que vous souhaitez
                      annoter.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card
                        className="p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setDataType("audio")}
                      >
                        <FileAudio className="h-12 w-12 text-primary mb-2" />
                        <p className="font-semibold">Audio</p>
                        <p className="text-sm text-muted-foreground">
                          Transcription, STT...
                        </p>
                      </Card>
                      <Card
                        className="p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setDataType("text")}
                      >
                        <FileText className="h-12 w-12 text-primary mb-2" />
                        <p className="font-semibold">Texte</p>
                        <p className="text-sm text-muted-foreground">
                          Traduction, classification...
                        </p>
                      </Card>
                      <Card
                        className="p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setDataType("image")}
                      >
                        <ImageIcon className="h-12 w-12 text-primary mb-2" />
                        <p className="font-semibold">Image</p>
                        <p className="text-sm text-muted-foreground">
                          Description, détection...
                        </p>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => setDataType(null)}
                      className="mb-4 -ml-4 text-muted-foreground"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour au choix du type de données
                    </Button>

                    {/* Audio Annotation */}
                    {dataType === "audio" && (
                      <div className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-8 text-center">
                          <FileAudio className="h-16 w-16 text-primary mx-auto mb-4" />
                          <p className="font-medium mb-2">
                            audio_sample_{currentItem}.wav
                          </p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Durée: 00:15
                          </p>

                          <div className="flex items-center justify-center gap-4">
                            <Button variant="outline" size="sm">
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Pause className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4">
                          <div>
                            <Label htmlFor="transcription">Transcription</Label>
                            <Textarea
                              id="transcription"
                              placeholder="Saisissez la transcription de l'audio..."
                              rows={3}
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="language">Langue détectée</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="wolof">Wolof</SelectItem>
                                  <SelectItem value="french">
                                    Français
                                  </SelectItem>
                                  <SelectItem value="bambara">
                                    Bambara
                                  </SelectItem>
                                  <SelectItem value="swahili">
                                    Swahili
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="quality">Qualité audio</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">
                                    Excellente
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    Moyenne
                                  </SelectItem>
                                  <SelectItem value="low">Faible</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="speaker">
                              Caractéristiques du locuteur
                            </Label>
                            <Input
                              id="speaker"
                              placeholder="Ex: Homme, 30-40 ans, accent urbain"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text Annotation */}
                    {dataType === "text" && (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Texte source (Wolof)</Label>
                            <Card className="p-4 bg-muted/50 min-h-[150px]">
                              <p className="text-sm">
                                "Nanga def? Mangi fi rekk. No tudd?"
                              </p>
                            </Card>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="translation">
                              Traduction (Français)
                            </Label>
                            <Textarea
                              id="translation"
                              placeholder="Saisissez la traduction..."
                              rows={5}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 pt-4">
                          <div>
                            <Label htmlFor="domain">Domaine</Label>
                            <Input
                              id="domain"
                              placeholder="Ex: Salutations, conversation courante"
                            />
                          </div>
                          <div>
                            <Label htmlFor="validation">
                              Validation de l'alignement
                            </Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Oui</SelectItem>
                                <SelectItem value="no">Non</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Image Annotation */}
                    {dataType === "image" && (
                      <div className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 flex justify-center items-center">
                          <Image
                            src={`https://picsum.photos/seed/${currentItem}/600/400`}
                            alt={`Image ${currentItem}`}
                            className="rounded-md max-h-96 object-contain"
                          />
                        </div>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label htmlFor="description">
                              Description de l'image
                            </Label>
                            <Textarea
                              id="description"
                              placeholder="Décrivez ce que vous voyez dans l'image..."
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="tags">
                              Tags (séparés par des virgules)
                            </Label>
                            <Input
                              id="tags"
                              placeholder="Ex: femme, marché, fruits, Dakar"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>

            {/* Panneau latéral */}
            <div className="space-y-6">
              {/* Progression */}
              <Card className="p-6 bg-card border-border">
                <h3 className="font-semibold mb-4">Progression</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Complétés</span>
                    <span className="font-medium">
                      {currentItem - 1} / {totalItems}
                    </span>
                  </div>
                  <Progress value={progress} />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Restants</span>
                    <span className="font-medium">
                      {totalItems - currentItem + 1}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Statistiques */}
              <Card className="p-6 bg-card border-border">
                <h3 className="font-semibold mb-4">Statistiques</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Temps moyen</span>
                    <span className="font-medium">2m 30s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Taux de confiance IA
                    </span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items validés</span>
                    <span className="font-medium text-primary">
                      {currentItem - 1}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card className="p-6 bg-card border-border">
                <h3 className="font-semibold mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Suggérer des labels
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Check className="h-4 w-4 mr-2" />
                    Valider en lot
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <SkipForward className="h-4 w-4 mr-2" />
                    Passer cet item
                  </Button>
                </div>
              </Card>

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={currentItem === 1}
                  onClick={() => setCurrentItem(currentItem - 1)}
                >
                  Précédent
                </Button>
                <Button className="flex-1" onClick={handleNext}>
                  {currentItem === totalItems ? "Terminer" : "Suivant"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

    </div>
  )
}

export default Annotate