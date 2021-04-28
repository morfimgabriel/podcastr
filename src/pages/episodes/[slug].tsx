import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { } from 'next/router'
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { api } from '../../services/api';
import { convertDurationToTimeString } from '../../utils/convertDurationToTimeString';
import styles from './episode.module.scss';

type Episode = {
    id: string;
    title: string;
    thumbnail: string;
    members: string;
    duration: number;
    durationAsString: string;
    description: string;
    url: string;
    publishedAt: string;
}

type EpisodeProps = {
    episode: Episode;
}



// o episode so foi passado por parametro graças aos props do getstaticProps
export default function Episode({ episode }: EpisodeProps) {

    // codigo usado quando fallback é true ja que ocorre a o get na api pelo front e nao pelo servidor do next
    //const router = useRouter();

    //
    // enquanto carrega a solicitação ira retornar o Carregando na tag p, pois se não o episode vai estar default e vai gerar erro na aplicação do build
    //if (router.isFallback) {
    //    return <p> Carregando </p>

    //}

    return (
        <div className={styles.episode}>
            <div className={styles.thumbnailContainer}>
                <Link href="/">
                    <button>
                        <img src="/arrow-left.svg" alt="Voltar" />
                    </button>
                </Link>

                <Image
                    width={700}
                    height={300}
                    src={episode.thumbnail}
                    objectFit="cover" />
                <button type="button">
                    <img src="/play.svg" alt="Tocar episódio" />
                </button>
            </div>

            <header>
                <h1> {episode.title} </h1>
                <span> {episode.members} </span>
                <span> {episode.publishedAt} </span>
                <span> {episode.durationAsString} </span>
            </header>

            <div className={styles.description} dangerouslySetInnerHTML={{ __html: episode.description }} />

        </div>
    )
}


export const getStaticPaths: GetStaticPaths = async () => {
    // Realizado a busca dos 2 ultimos podcast lançados para criar a pagina estatica dentro dos paths por conta do slug ser algo dinamico (existe varios ids para criar cada pagina)
    const { data } = await api.get('episodes', {
        params: {
            _limit: 12,
            _sort: 'published_at',
            _order: 'desc'
        }
    })

    const paths = data.map(episode => {
        return {
            params: {
                slug: episode.id
            }
        }
    })

    return {
        paths,
        fallback: 'blocking'
        // fallback false retorna 404 caso o episódio n estiver no path
        // fallback True caso não existir o episodio solicitado ele busca pelo lado do cliente a chamada da api para verificar se o episodio existe,
        // fallback blocking roda no next.js e nao no cliente, caso o path n estiver estatico ou nao existir ele vai buscar para retornar em tela
        // utilizando o getStaticProps abaixo
    }
}

export const getStaticProps: GetStaticProps = async (context) => {
    const { slug } = context.params
    const { data } = await api.get(`/episodes/${slug}`)

    const episode = {
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        publishedAt: format(parseISO(data.published_at), 'd MMM yy', { locale: ptBR }),
        duration: Number(data.file.duration),
        durationAsString: convertDurationToTimeString(Number(data.file.duration)),
        description: data.description,
        members: data.members,
        url: data.file.url,
    }

    return {
        props: {
            episode
        },
        revalidate: 60 * 60 * 24, // 24 hours
    }
}