import 'package:mangayomi/bridge_lib.dart';
import 'dart:convert';

class Hentaila extends MProvider {
  Hentaila({required this.source});

  MSource source;

  final Client client = Client();

  @override
  String get baseUrl => source.baseUrl!;

  @override
  Future<MPages> getPopular(int page) async {
    final res = (await client.get(Uri.parse("$baseUrl/popular?page=$page"))).body;
    // Usa xpath o parseHtml para extraer datos
    List<MManga> animeList = [];
    // Ejemplo: extrae nombres, imágenes y enlaces
    final names = xpath(res, '//selector/@title');  // Ajusta selectores
    final images = xpath(res, '//selector/@src');
    final urls = xpath(res, '//selector/@href');
    for (var i = 0; i < names.length; i++) {
      MManga anime = MManga();
      anime.name = names[i];
      anime.imageUrl = images[i];
      anime.link = urls[i];
      animeList.add(anime);
    }
    return MPages(animeList, true);  // true si hay más páginas
  }

  @override
  Future<MPages> getLatestUpdates(int page) async {
    // Similar a getPopular, pero para actualizaciones recientes
  }

  @override
  Future<MPages> search(String query, int page, FilterList filterList) async {
    // Implementa búsqueda con filtros si es necesario
  }

  // Agrega otros métodos como getDetail, getVideoList según la página
}