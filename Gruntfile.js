module.exports = function (grunt) {
    var path = require('path');

    // add md5-map to seajs config
    grunt.registerMultiTask('modify-config', function () {
        if (!this.data.cfgPath) {
            grunt.log.warn('Missing config file option.');
            return;
        }
        var alias = grunt.file.readJSON(this.data.cfgPath);
        var mapArr = grunt.config.get('md5map');
        mapArr.forEach(function (item) {
            alias[item[0]] = item[1];
        });
        grunt.file.write(this.data.cfgPath, JSON.stringify(alias, null, '\t'));
        grunt.log.writeln('File "' + this.data.cfgPath + '" modified.');
    });

    var alias = (function(){
        var cfgPath = path.join(grunt.option('runCwd'),'./asset/config.json');
        if (grunt.file.exists(cfgPath)) {
            return grunt.file.readJSON(cfgPath);
        }
        return {};
    })();

    var pkg = (function(){
        if (grunt.file.exists(path.join(grunt.option('runCwd'),'package.json'))) {
            return grunt.file.readJSON(path.join(grunt.option('runCwd'),'package.json'));
        }
        return {};
    })();

    var excludeFiles = (function(){
        var outFiles = pkg.excludeFiles || [],
            debugFiles = outFiles.map(function(item){
              return item.replace(/\.js$/,"-debug.js");
            }); 
            return outFiles.concat(debugFiles);
    })();
	
    grunt.initConfig({
        alias: alias,
        beginWidget: {
            dist: pkg.widgetsConfig
        },
        "modify-config": {
            target: {
                cfgPath: './asset/config.json'
            }
        },
        ctrconcat: {
            base: {
                files: [
                    {
                        src: ['./src/base/css/reset.css', './src/base/css/common.css', './src/base/css/header.css', './src/base/css/footer.css'],
                        dest: '.build/base/css/out_base.css'
                    }
                ]
            }
        },
        transport: {
            options: {
                alias: '<%= alias %>',
                debug: true,
                paths: ['./asset']
            },

            page: {
                options: {
                    idleading: 'page/'
                },
                files: [
                    {
                        expand: true,
                        cwd: './src/page/',
                        src: ['**/*.js', '**/*.css'],
                        filter: 'isFile',
                        dest: '.build/page/'
                    }
                ]
            },
            business: {
                options: {
                    idleading: 'business/'
                },
                files: [
                    {
                        expand: true,
                        cwd: './src/business/',
                        src: ['**/*.js', '**/*.css'],
                        filter: 'isFile',
                        dest: '.build/business/'
                    }
                ]
            }
        },
        concat: {
            options: {
                include: 'relative',
                paths: ['./asset']
            },
            page: {
                options: {
                    excludeCss: true
                },
                files: [
                    {
                        expand: true,
                        cwd: '.build/page',
                        src: ['**/*.js'],
                        filter:function(filepath){
							var curPath = path.relative(".build",filepath);
							if(excludeFiles.indexOf(curPath.replace(/\\/g,'/'))+1){
								return false;
							}
							return true;
                        },
                        dest: '.build/concat'
                    },
                    {
                        expand: true,
                        cwd: '.build/page',
                        src: ['**/*.css'],
                        dest: '.build/page'
                    }
                ]
            }
        },
        concatFiles: {
            options: {
                include: 'relative',
                paths: ['src']
            },
            page: {
                files: [
                    {
                        expand: true,
                        cwd: '.build/page',
                        src: ['**/*.js'],
                        dest: '.build/concat'
                    }
                ]
            }
        },
        concatCss: {
            options: {
                include: 'relative',
                separator: ' '
            },
            page: {
                files: [
                    {
                        expand: true,
                        cwd: '.build/page',
                        src: ['**/*.js'],
                        dest: '.build/concat'
                    }
                ]
            }
        },
        uglify: {
            page: {
                files: [
                    {
                        expand: true,
                        cwd: '.build/concat/',
                        src: ['**/*.js', '!**/*-debug.js', '!**/*-debug.css.js'],
                        dest: '.build/uglify'
                    }
                ]
            },
            other: {
                files: [
                    {
                        expand: true,
                        cwd: './src/base/',
                        src: ['**/*.js'],
                        dest: './asset/base'
                    }
                ]
            },
            base: {
                files: [
                    {
                        expand: true,
                        cwd: './.build/base/',
                        src: ['**/*.js'],
                        dest: './asset/base/'
                    }
                ]
            }
        },
        md5: {
            options: {
                encoding: 'utf8',
                keepBasename: true,
                keepExtension: true
            },
            js: {
                options: {
                    after: function (fileChanges) {
                        var map = [];
                        fileChanges.forEach(function (obj) {
                            obj.oldPath = obj.oldPath.replace('.build/uglify/', '');
                            obj.newPath = obj.newPath.replace('asset/page' + '/', '');
                            var temp = 'page/' + obj.oldPath;
                            temp = temp.substring(0, temp.length - 3);
                            map.push([temp, 'page/' + obj.newPath]);
                        });
                        var newArr = grunt.config.get('md5map') || [].concat(map);
                        grunt.config.set('md5map', newArr);
                    }

                },
                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        cwd: '.build/uglify',      // Src matches are relative to this path.
                        src: ['**/*.js', '!**/*.css.js'], // Actual pattern(s) to match.
                        dest: 'asset/page'   // Destination path prefix.
                    }
                ]
            },
            jsDebug: {
                options: {
                    after: function (fileChanges) {
                        var map = [];
                        fileChanges.forEach(function (obj) {
                            obj.oldPath = obj.oldPath.replace('.build/concat/', '');
                            obj.newPath = obj.newPath.replace('asset/page' + '/', '');
                            var temp = 'page/' + obj.oldPath;
                            temp = temp.substring(0, temp.length - 3);
                            map.push([temp, 'page/' + obj.newPath]);
                        });
                        var newArr = (grunt.config.get('md5map') || []).concat(map);
                        grunt.config.set('md5map', newArr);
                    }
                },
                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        cwd: '.build/concat',      // Src matches are relative to this path.
                        src: ['**/*-debug.js', '!**/*.css.js'], // Actual pattern(s) to match.
                        dest: 'asset/page'   // Destination path prefix.
                    }
                ]
            }

        },
        imagemin: {
            /* 压缩图片大小 */
            page: {
                options: {
                    optimizationLevel: 3 //定义 PNG 图片优化水平
                },
                files: [
                    {
                        expand: true,
                        cwd: '.build/page',
                        src: ['**/*.{png,jpg,jpeg}'], // 优化 img 目录下所有 png/jpg/jpeg 图片
                        dest: 'asset/page' // 优化后的图片保存位置，覆盖旧图片，并且不作提示
                    }
                ]
            },
            base: {
                options: {
                    optimizationLevel: 3 //定义 PNG 图片优化水平
                },
                files: [
                    {
                        expand: true,
                        cwd: './src',
                        src: ['base/**/*.{png,jpg,jpeg,gif,ico}'], // 优化 img 目录下所有 png/jpg/jpeg 图片
                        dest: 'asset' // 优化后的图片保存位置，覆盖旧图片，并且不作提示
                    }
                ]
            },
            other: {
                options: {
                    optimizationLevel: 3 //定义 PNG 图片优化水平
                },
                files: [
                    {
                        expand: true,
                        cwd: './src',
                        src: ['**/*.{png,jpg,jpeg}', '!page/**/*.{png,jpg,jpeg}', '!business/**/*.{png,jpg,jpeg}', '!widget/**/*.{png,jpg,jpeg}'],
                        dest: 'asset'
                    }
                ]
            }
        },
        "cssmin": {
            page: {
                files: [
                    {
                        cwd: '.build/concat',
                        src: ['**/*.css', '!**/*-debug.css'],
                        expand: true,
                        dest: 'asset/page'
                    }
                ]
            },
            other: {
                files: [
                    {
                        cwd: './src',
                        src: ['**/*.css', '!page/**/*.css', '!business/**/*.css', '!widget/**/*.css'],
                        expand: true,
                        dest: './asset'
                    }
                ]
            },
            base: {
                cwd: 'src/base/css',
                src: ['**/*.css'],
                expand: true,
                dest: 'asset/base/css'
            }
        },
        "copy": {
            pageBusiness: {
                files: [
                    {
                        cwd: './src',
                        src: ['business/**/*.{png,jpg,jpeg,gif}'],
                        expand: true,
                        dest: '.build'
                    },
                    {
                        cwd: './src',
                        src: ['page/**/*.{png,jpg,jpeg,gif}'],
                        expand: true,
                        dest: '.build'
                    }
                ]
            },
            base: {
                files: [
                    {
                        expand: true,
                        cwd: './src',
                        src: ['base/**/*.{otf,eot,svg,ttf,woff}'],
                        dest: './asset'
                    }
                ]
            },
            imagebase:{
                files: [
                    {
                        expand: true,
                        cwd: './src',
                        src: ['base/**/*.{png,jpg,jpeg,gif,ico}'],
                        dest: 'asset'
                    }
                ]
            },
            page:{
                files: [
                    {
                        expand: true,
                        cwd: '.build/page',
                        src: ['**/*.{png,jpg,jpeg,gif}'],
                        dest: 'asset/page'
                    }
                ]
            },
            css: {
                files: [
                    {
                        cwd: '.build/concat',
                        src: '**/*.css',
                        expand: true,
                        dest: './asset/page'
                    }
                ]
            }
        },
        clean: {
            spm: ['.build'],
            dist: ['asset/*', '!asset/widget', '!asset/config.json'],
            widget: ['asset/widget']
        }
    });

    grunt.loadNpmTasks('grunt-cmd-transport');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.task.renameTask('concat', 'ctrconcat');
    grunt.loadNpmTasks('grunt-cmd-concatself');
    grunt.loadNpmTasks('grunt-cmd-concatfile');
    grunt.loadNpmTasks('grunt-cmd-concatcss');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-md5-ysf');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-ingrunts');

   grunt.registerTask('build-page', ['clean:spm', 'clean:dist', 'cssmin:base', 'copy:imagebase', 'uglify:other', 'copy:base', 'transport:page', 'transport:business', 'copy:pageBusiness', 'concat:page', 'concatCss:page', 'concatFiles:page', 'uglify:page', 'md5:js','md5:jsDebug', 'cssmin:page', 'copy:page', 'modify-config','clean:spm']);
    /* 1.清空：.build
     * 2.清空asset
     * #3.合并base下指定的css和js
     * 5.压缩base下指定的css,src/base/ --> asset/base
     * 6.拷贝base下所有图片,src/base/**.{jpg|png|jpeg|gif} --> asset/base/
     * 7.压缩base下所有的js,src/base/**.js --> asset/base/**.js
     * 8.拷贝base下剩下的文件,src/base/**.{otf,eot,svg,ttf,woff} --> asset/base/
     * 8.提取page目录下页面模块的id和依赖,src/page/**.js --> .build/page
     * 9.提取business目录下页面模块的id和依赖,src/business/**.js --> .build/business
     * 10.拷贝page和business下css和图片，以协同作下一步处理,src/{business|page}/**.{png,jpg,jpeg,gif} --> .build/
     * 12.合并page依赖的business下的js文件,.build/page --> .build/concat
     * 11.合并page依赖的business下的css文件，到page下css文件中,.build/page --> .build/concat
     * 13.合并page依赖的business下的图片文件夹,.build/page --> .build/concat
     * 14.压缩合并的js,.build/concat/**.js --> .build/uglify/
     * 15.根据合并后js的md5值，重命令js文件,.build/uglify/**.js --> asset/page/
     * 16.压缩合并的css，.build/concat --> asset/page
     * 17.拷贝合并的imgs文件夹, .build/page/**.{jpg|png|jpeg|gif}a --> asset/page
     * 18.修改seaConfig.js配置文件*/

    grunt.registerTask('build-widget', ['clean:widget', 'beginWidget:dist']);
};
