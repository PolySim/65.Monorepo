import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Hike } from './hike.entity';
import { State } from './state.entity';

@Entity('Category')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255, nullable: true })
  image_path: string;

  @ManyToMany(() => State, (state) => state.categories)
  @JoinTable({
    name: 'J_Category_State',
    joinColumn: {
      name: 'categoryId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'stateId',
      referencedColumnName: 'id',
    },
  })
  states: State[];

  @OneToMany(() => Hike, (hike) => hike.category)
  hikes: Hike[];
}
