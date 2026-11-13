import Svg, { Circle, Path } from 'react-native-svg';

export function WorkspaceArt() {
  return (
    <Svg viewBox="0 0 520 520" width="100%" height="100%" accessibilityElementsHidden>
      <Circle cx="312" cy="332" r="185" stroke="#78A797" strokeOpacity=".42" fill="none" />
      <Circle cx="312" cy="332" r="225" stroke="#78A797" strokeOpacity=".29" fill="none" />
      <Circle cx="312" cy="332" r="264" stroke="#78A797" strokeOpacity=".16" fill="none" />
      <Path d="M193 413c-27-101 5-219 158-260 36 132-42 231-158 260Z" fill="#B4D98D" />
      <Path d="M196 405c-11-91-73-132-147-125 16 87 74 134 147 125Z" fill="#61957D" />
      <Path d="M178 461c43-98 94-180 160-260M201 410c-37-44-76-77-116-105m162 20 55-16m-24-34 44-15" fill="none" stroke="#244F40" strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="443" cy="203" r="5" fill="#DDF1BC" />
      <Circle cx="151" cy="220" r="3" fill="#9EC8AF" />
      <Path d="M430 106v26m-13-13h26" stroke="#CDEDA7" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
