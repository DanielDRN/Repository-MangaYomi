import '../../../../../model/source.dart';

Source get hentailaSource => _hentailaSource;
const _hentailaVersion = "0.1.0";
const _hentailaSourceCodeUrl =
    "https://raw.githubusercontent.com/m2k3a/mangayomi-extensions/$branchName/dart/anime/src/es/hentaila/hentaila.dart";
Source _hentailaSource = Source(
  name: "Hentaila",  // Nombre de la fuente
  baseUrl: "https://hentaila.com/hub",  // URL base de la página
  lang: "es",  // Idioma
  typeSource: "single",  // Tipo: "single" o "multi"
  iconUrl: "https://raw.githubusercontent.com/m2k3a/mangayomi-extensions/$branchName/dart/anime/src/es/hentaila/icon.png",  // URL del ícono (sube una imagen)
  sourceCodeUrl: _hentailaSourceCodeUrl,
  version: _hentailaVersion,
  itemType: ItemType.anime,
);