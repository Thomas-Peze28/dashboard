import { useEffect, useState } from 'react'
import { Heart, RefreshCw } from 'lucide-react'
import { fetchStickyNoteData } from '../../../api/stickyNotes'
import type { StickyNoteContent } from '../../../types/stickyNote'

type PokemonNoteContent = Extract<StickyNoteContent, { kind: 'pokemonRandom' | 'pokemonCard' }>

type PokemonContentProps = {
  noteId: string
  content: PokemonNoteContent
  columns: number
  rows: number
  onChangeContent: (content: PokemonNoteContent) => Promise<boolean>
}

const buttonClass =
  'absolute bottom-1 z-10 inline-flex h-7 w-7 items-center justify-center rounded-sm bg-white/85 shadow-sm transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60'

// Les détails sont écrits dans la langue de la carte et peuvent manquer (ex : un Dresseur n'a pas de PV).
// Une carte cherchée par son nom n'en a aucun : le backend ne renvoie alors que l'identifiant, le nom et l'image.
type PokemonCardData = {
  id: string
  name: string
  image: string
  category?: string | null
  hp?: number | null
  types?: string[]
  stage?: string | null
  rarity?: string | null
  set?: string | null
  illustrator?: string | null
}

function PokemonCardInfo({ card }: { card: PokemonCardData }) {
  const details = [
    { label: 'Catégorie', value: card.category },
    { label: 'Type', value: card.types?.join(', ') },
    { label: 'PV', value: card.hp },
    { label: 'Stade', value: card.stage },
    { label: 'Rareté', value: card.rarity },
    { label: 'Extension', value: card.set },
    { label: 'Illustration', value: card.illustrator },
  ].filter((detail) => detail.value !== null && detail.value !== undefined && detail.value !== '')

  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-[4cqmin] pr-[3cqmin]">
      <span className="line-clamp-2 text-[10cqmin] font-bold leading-tight">{card.name}</span>
      <dl className="flex flex-col gap-[1.5cqmin] text-[5.5cqmin] leading-tight">
        {details.map(({ label, value }) => (
          <div key={label} className="flex gap-[2cqmin]">
            <dt className="shrink-0 text-gray-700">{label}</dt>
            <dd className="min-w-0 truncate font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function PokemonContent({ noteId, content, columns, rows, onChangeContent }: PokemonContentProps) {
  const [card, setCard] = useState<PokemonCardData | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [drawCount, setDrawCount] = useState(0)
  const [isSavingFavorite, setIsSavingFavorite] = useState(false)
  const isFavorite = content.kind === 'pokemonCard' && Boolean(content.cardId)
  // Carte cherchée par son nom : toujours la même, donc ni tirage ni favori.
  const isNamed = content.kind === 'pokemonCard' && !content.cardId

  // Carte aléatoire : le backend en tire une nouvelle à chaque appel (une par affichage, puis une par clic).
  // Carte favorite : le backend renvoie toujours la même, inutile de la redemander en changeant de mode.
  useEffect(() => {
    let isCancelled = false
    const load = async () => {
      try {
        const loaded = await fetchStickyNoteData<PokemonCardData>(noteId)

        if (isCancelled) return

        setCard(loaded)
        setError('')
      } catch (loadError) {
        if (isCancelled) return

        const message = loadError instanceof Error ? loadError.message : ''
        setError(message === 'Pokémon card not found.' ? 'Carte introuvable' : 'Carte indisponible')
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      isCancelled = true
    }
  }, [noteId, drawCount])

  const handleReload = () => {
    setIsLoading(true)
    setDrawCount((count) => count + 1)
  }

  // Le favori garde la carte affichée ; le retirer revient au tirage aléatoire, sans changer de carte tout de suite.
  const handleToggleFavorite = async () => {
    if (!card) return

    setIsSavingFavorite(true)
    await onChangeContent(
      isFavorite
        ? { kind: 'pokemonRandom', language: content.language }
        : { kind: 'pokemonCard', language: content.language, cardId: card.id, name: card.name },
    )
    setIsSavingFavorite(false)
  }

  // Grand format : la carte à gauche, ses informations à droite.
  const isLarge = columns > rows

  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[5cqmin] p-[2cqmin] text-gray-900 [container-type:size] group-hover/note:z-20">
      {card && !error ? (
        <img
          src={card.image}
          alt={card.name}
          title={card.name}
          draggable={false}
          onError={() => {
            setCard(null)
            setError('Carte indisponible')
          }}
          // Au survol, la carte s'agrandit au-delà du post-it pour rester lisible (surtout en 1 × 1).
          className={`h-full object-contain drop-shadow-md transition-transform duration-200 ${
            isLarge ? 'w-auto shrink-0 origin-left' : 'w-full'
          } ${
            columns === 1 ? 'group-hover/note:scale-[2.4]' : 'group-hover/note:scale-[1.5]'
          }`}
        />
      ) : (
        <span className="text-center text-[8cqmin] leading-tight text-gray-700">
          {error || 'Chargement...'}
        </span>
      )}
      {isLarge && card && !error && <PokemonCardInfo card={card} />}
      {!isFavorite && !isNamed && (
        <button
          type="button"
          onClick={handleReload}
          disabled={isLoading}
          aria-label="Tirer une autre carte"
          title="Tirer une autre carte"
          className={`${buttonClass} left-1 text-gray-800 hover:bg-gray-800 focus-visible:outline-gray-800`}
        >
          <RefreshCw size={14} aria-hidden="true" className={isLoading ? 'animate-spin' : ''} />
        </button>
      )}
      {card && !error && !isNamed && (
        <button
          type="button"
          onClick={() => void handleToggleFavorite()}
          disabled={isLoading || isSavingFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Garder cette carte'}
          title={isFavorite ? 'Retirer des favoris' : 'Garder cette carte'}
          className={`${buttonClass} text-red-600 hover:bg-red-600 focus-visible:outline-red-600 ${
            isFavorite ? 'left-1' : 'left-9'
          }`}
        >
          <Heart size={14} aria-hidden="true" className={isFavorite ? 'fill-current' : ''} />
        </button>
      )}
    </div>
  )
}

export default PokemonContent
