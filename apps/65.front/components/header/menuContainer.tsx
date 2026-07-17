import BurgerMenu from "./burgerMenu";
import Menu from "./menu";

const MenuContainer = () => {
  return (
    <>
      <div className="hidden lg:block">
        <Menu />
      </div>
      <div className="lg:hidden">
        <BurgerMenu />
      </div>
    </>
  );
};

export default MenuContainer;
