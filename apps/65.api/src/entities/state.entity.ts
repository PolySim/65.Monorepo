import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Hike } from './hike.entity';

@Entity('State')
export class State {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255, nullable: true })
  image_path: string;

  @ManyToMany(() => Category, (category) => category.states)
  categories: Category[];

  @OneToMany(() => Hike, (hike) => hike.state)
  hikes: Hike[];
}
