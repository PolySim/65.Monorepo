import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from './userRole.entity';
import { Favorite } from './favorite.entity';

@Entity('User')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('integer')
  roleId: number;

  @Column('varchar', { length: 255 })
  subId: string;

  // Relation Many-to-One : plusieurs utilisateurs peuvent avoir le même rôle
  @ManyToOne(() => UserRole, (userRole) => userRole.users)
  @JoinColumn({ name: 'roleId' })
  role: UserRole;

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];
}
