import { GetStaticProps } from 'next';
import { api } from '../services/api';
import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { convertDurationToTimeString } from '../utils/convertDurationToTimeString';
import styles from './home.module.scss'

type Episode = {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  members: string;
  duration: number;
  durationAsString: string;
  url: string;
  publishedAt: string;
}

type HomeProps = {
  latestEpisodes: Episode[];
  allEpisodes: Episode[];
}

export default function Home({ latestEpisodes, allEpisodes }: HomeProps) {
  //SPA toda vez que a pagina é gerada da um get
  //useEffect(() => {
  // fetch('http://localhost:3333/episodes')
  //    .then(response => response.json())
  //    .then(data => console.log(data))
  //}, [])

  return (
    <div className={styles.homepage}>
      <section className={styles.latestEpisodes}>
        <h2> últimos Lançamentos</h2>
        <ul>
          {latestEpisodes.map(episode => {
            return (
              <li key={episode.id}>
                <Image
                  width={192}
                  height={192}
                  src={episode.thumbnail}
                  alt={episode.title}
                  objectFit="cover"
                />

                <div className={styles.episodeDetails}>
                  <Link href={`/episodes/${episode.id}`}>
                    <a>{episode.title}</a>
                  </Link>

                  <p>{episode.members}</p>
                  <span> {episode.publishedAt} </span>
                  <span> {episode.durationAsString} </span>
                </div>

                <button type="button">
                  <img src="/play-green.svg" alt="Tocar Episódio" />
                </button>
              </li>
            )
          })}

        </ul>
      </section>

      <section className={styles.allEpisodes}>
        <h2> Todos episódios </h2>

        <table cellSpacing={0}>
          <thead>
            <tr>
              <th></th>
              <th>Podcast</th>
              <th>Integrantes</th>
              <th>Data</th>
              <th>Duração</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {allEpisodes.map(episode => {
              return (
                <tr key={episode.id}>
                  <td style={{ width: 72 }}>
                    <Image
                      width={120}
                      height={120}
                      src={episode.thumbnail}
                      alt={episode.title}
                      objectFit="cover" />
                  </td>
                  <td>
                    <Link href={`/episodes/${episode.id}`}>
                      <a>{episode.title}</a>
                    </Link>
                  </td>
                  <td> {episode.members} </td>
                  <td style={{ width: 100 }}> {episode.publishedAt} </td>
                  <td> {episode.durationAsString} </td>
                  <td>
                    <button type="button">
                      <img src="/play-green.svg" alt="Tocar episódio" />
                    </button>
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>

      </section>
    </div>
  )
}

// SSR consegue pegar da API e mostrar em tela mesmo com o js desativado pois roda dentro do server next
//export async function getServerSideProps() {
//  const response = await fetch('http://localhost:3333/episodes')
//  const data = await response.json()

//  return {
//    props: {
//      episodes: data,
//    }
//  }
//
//}

// SSG gera uma página statica para não precisar dar get mais de uma vez, programando ela para dar get umas vez a cada x horas
export const getStaticProps: GetStaticProps = async () => {
  const { data } = await api.get('episodes', {
    params: {
      _limit: 12,
      _sort: 'published_at',
      _order: 'desc'
    }
  })
  // Tratamento dos dados antes de enviar para os componentes
  const episodes = data.map(episode => {
    return {
      id: episode.id,
      title: episode.title,
      thumbnail: episode.thumbnail,
      publishedAt: format(parseISO(episode.published_at), 'd MMM yy', { locale: ptBR }),
      duration: Number(episode.file.duration),
      durationAsString: convertDurationToTimeString(Number(episode.file.duration)),
      description: episode.description,
      members: episode.members,
      url: episode.file.url,

    };
  })

  const latestEpisodes = episodes.slice(0, 2)
  const allEpisodes = episodes.slice(2, episodes.length)

  return {
    props: {
      latestEpisodes,
      allEpisodes
    },
    //60 segundos * 60 = 1 hora * 8 = 8 horas, de 8 em 8 horas vai realizar um get na API ( só funciona em produção, ou seja com uma build)
    revalidate: 60 * 60 * 8,
  }

}