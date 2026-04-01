import 'dart:convert';
import 'dart:developer';
import 'dart:io';
import 'model/source.dart';

void main() {
  final jsSources = _searchJsSources(Directory("javascript"));
  genManga(
    jsSources.where((element) => element.itemType!.name == "manga").toList(),
  );
  genAnime(
    jsSources.where((element) => element.itemType!.name == "anime").toList(),
  );
  genNovel(
    jsSources.where((element) => element.itemType!.name == "novel").toList(),
  );
}

void genManga(List<Source> jsMangasourceList) {
  List<Source> mangaSources = [];
  // Only add JS sources, ignore existing file content
  mangaSources.addAll(jsMangasourceList);
  final List<Map<String, dynamic>> jsonList = mangaSources
      .map((source) => source.toJson())
      .toList();
  final jsonString = jsonEncode(jsonList);

  final file = File('index.json');
  file.writeAsStringSync(jsonString);

  log('JSON file created: ${file.path}');
}

void genAnime(List<Source> jsAnimesourceList) {
  List<Source> animeSources = [];
  // Only add JS sources, ignore existing file content
  animeSources.addAll(jsAnimesourceList);
  final List<Map<String, dynamic>> jsonList = animeSources
      .map((source) => source.toJson())
      .toList();
  final jsonString = jsonEncode(jsonList);

  final file = File('anime_index.json');
  file.writeAsStringSync(jsonString);

  log('JSON file created: ${file.path}');
}

void genNovel(List<Source> jsNovelSourceList) {
  List<Source> novelSources = [];
  // Only add JS sources, ignore existing file content
  novelSources.addAll(jsNovelSourceList);
  final List<Map<String, dynamic>> jsonList = novelSources
      .map((source) => source.toJson())
      .toList();
  final jsonString = jsonEncode(jsonList);

  final file = File('novel_index.json');
  file.writeAsStringSync(jsonString);

  log('JSON file created: ${file.path}');
}

List<Source> _searchJsSources(Directory dir) {
  List<Source> sourceList = [];
  List<FileSystemEntity> entities = dir.listSync();
  for (FileSystemEntity entity in entities) {
    if (entity is Directory) {
      List<FileSystemEntity> entities = entity.listSync();
      for (FileSystemEntity entity in entities) {
        if (entity is Directory) {
          sourceList.addAll(_searchJsSources(entity));
        } else if (entity is File && entity.path.endsWith('.js')) {
          try {
            final regex = RegExp(
              r'const\s+mangayomiSources\s*=\s*(\[[\s\S]*?\]);',
              dotAll: true,
            );
            final defaultSource = Source();
            final match = regex.firstMatch(entity.readAsStringSync());
            if (match != null) {
              try {
                for (var sourceJson in jsonDecode(match.group(1)!) as List) {
                  final langs = sourceJson["langs"] as List?;
                  const gitOwner = 'DanielDRN';
                  const gitRepo = 'MangaYomi';
                  Source source = Source.fromJson(sourceJson)
                    ..sourceCodeLanguage = 1
                    ..appMinVerReq =
                        sourceJson["appMinVerReq"] ?? defaultSource.appMinVerReq
                    ..sourceCodeUrl =
                        "https://raw.githubusercontent.com/$gitOwner/$gitRepo/$branchName/javascript/${sourceJson["pkgPath"] ?? sourceJson["pkgName"] ?? sourceJson["name"]?.toLowerCase().replaceAll(" ", "") ?? "unknown"}";
                  if (sourceJson["id"] != null) {
                    source = source..id = int.tryParse("${sourceJson["id"]}");
                  }
                  if (langs?.isNotEmpty ?? false) {
                    for (var lang in langs!) {
                      final id = sourceJson["ids"]?[lang] as int?;
                      sourceList.add(
                        Source.fromJson(source.toJson())
                          ..lang = lang
                          ..id =
                              id ??
                              'mangayomi-js-$lang-${source.name}'.hashCode,
                      );
                    }
                  } else {
                    sourceList.add(source);
                  }
                }
              } catch (e) {
                log('Error parsing JSON in file ${entity.path}: $e');
              }
            } else {
              log('No mangayomiSources found in file ${entity.path}');
            }
          } catch (e) {
            log('Error reading file ${entity.path}: $e');
          }
        }
      }
    }
  }
  return sourceList;
}
