import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Difficulty } from './difficulty.entity';
import { Image } from './image.entity';
import { State } from './state.entity';
import { HikeGPX } from './higeGPX.entity';

@Entity('Hike')
export class Hike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('text', { nullable: true })
  content: string;

  @Column('text', { nullable: true })
  indication: string;

  @Column('varchar', { length: 255 })
  categoryId: string;

  @Column('varchar', { length: 255 })
  stateId: string;

  @Column('varchar', { length: 255, nullable: true })
  mainImageId: string;

  @Column('integer')
  mainImagePosition: number;

  @Column('varchar', { length: 255 })
  difficultyId: string;

  @Column('integer', { nullable: true })
  distance: number;

  @Column('varchar', { length: 255, nullable: true })
  duration: string;

  @Column('integer', { nullable: true })
  elevation: number;

  // Relations Many-to-One
  @ManyToOne(() => Category, (category) => category.hikes)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => State, (state) => state.hikes)
  @JoinColumn({ name: 'stateId' })
  state: State;

  @ManyToOne(() => Difficulty, (difficulty) => difficulty.hikes)
  @JoinColumn({ name: 'difficultyId' })
  difficulty: Difficulty;

  // Relation One-to-One pour l'image principale
  @OneToOne(() => Image, (image) => image.hikeAsMainImage, { nullable: true })
  @JoinColumn({ name: 'mainImageId' })
  mainImage: Image;

  // Relation One-to-Many pour toutes les images de la randonnée
  @OneToMany(() => Image, (image) => image.hike)
  images: Image[];

  @OneToMany(() => HikeGPX, (gpx) => gpx.hike)
  gpxFiles: HikeGPX[];
}
