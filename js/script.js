$(document).ready(function() {

	var proposicao;
	var	operadores = ['&', 'v', '>','%', '~'];
	var variaveisAceitas ='qwertyuiopasdfghjklzxcbnm'
	var primVar = undefined;	
	var varRegistradas = [];
	var valsIniciais = {};
	var formulaLog = [];
	var arvore = {};
	var linhasCont;

	$('.form-input').keypress(function (evt) {var charCode = evt.charCode || evt.keyCode;if (charCode  == 13) {return false;}});

	$('#mostrarLatex').on('click', function() {
		$('#codigoLatex').show();
	});

	$('#opbtn').on('click', function() {
		$('.op-info').show();
		$('.info').hide();
	});

	$('#infobtn').on('click', function() {
		$('.op-info').hide();
		$('.info').show();
	});

	// "Main" caller das funções
	$('#gerar').on('click', function() {
		proposicao = $('input').val().toLowerCase();

		// Reseta os objetos HTML
		$('.op-info').hide();
		$('.info').hide();
		$('#codigoLatex').empty();
		$('#tabelaVerdade').empty();
		$('.erro').remove();
		$('.linhasCont').remove();

		primVar = undefined;
		varRegistradas = [];	
		valsIniciais = {};	
		formulaLog = []; 
		arvore = {};
		
		removerEspaco();
		removerNegDupla();
		contVar(proposicao);

		if (varRegistradas.length > 5) {
			$('<p class =\'erro\'>O máximo de variáveis suportadas é 5</p>').insertAfter('.buttons');
			return false
		};

		if (!validarForma(proposicao)) {return false};

		removerDuplicatas(formulaLog);
		gerarTFArray();
		preencherArvore();
		tabelaVerdade();
		gerarTabelaLatex();
		
		return false; 	
	})

	function removerEspaco() {
		if (proposicao.match(/\s/)) {
			proposicao = proposicao.replace(/\s/, '');
			removerEspaco();
	}}

	function removerNegDupla() {
		if (proposicao.match(/\~{2}/)) {
			proposicao = proposicao.replace(/\~\~/, '');
			removerNegDupla();
	}}

	function negacao(value) {
		let newValue;	

		if (value == 1) {
			newValue = 0;
		}else if (value == 0) {
			newValue = 1;
		}
		return newValue;
	}

	function removerDuplicatas(proposicaoArray) {
		let distintas =[];

		for(let i of proposicaoArray) {
			if ($.inArray(i, distintas) == -1) {
				distintas.push(i)
			}
		}
		formulaLog = distintas; 
	}

	function contVar(proposicao) {
		for(let i of proposicao) {
			if ($.inArray(i, variaveisAceitas) !== -1) {
				if ($.inArray(i, varRegistradas) !== -1) {
					i++
				} else {varRegistradas.push(i);}
			}
		}
		
		varRegistradas.sort();
	}

	// Gera o array de verdadeiro ou falso (T ou F) para cada uma das variáveis e sub proposições
	function gerarTFArray() {
		let n = varRegistradas.length;
		let x = Math.pow(2, n);
		let w = 0;
		let u = 0;

		vazios();
		primValor();
		negacoes();

		function vazios() {
			let y=valsIniciais;

			for(let i of varRegistradas) {
				y[i]=[];
			}
		}
		
		function primValor() {
			let firstVal = varRegistradas[0].charAt();
			let firstValArray = valsIniciais[firstVal];
			
			for(let i = 0; i < x; i++) {
				if (i < x/2) {
					firstValArray.push(1)
				} else {
					firstValArray.push(0)
				}
			}
			if (n>1) {
				tfExterno()
			}
		}
		
		function tfExterno() {
			let b = 0;
			let varAtual = varRegistradas[u].charAt();
			let varAtualArray = valsIniciais[varAtual];
			
			if (varAtualArray.length > 0) {
				u++; 
				b++
			}

			if (b<1) {
				u++;
				tfInterno();
				w++;
			}
			
			if (u==n) {
				return true
			} else {
				tfExterno()
			}
			
			function tfInterno() {
				let z = Math.pow(2, n-(w+1))
				let e = z/2;
				for(let a = 0; a < e; a++) {
					varAtualArray.push(1);
				}

				for(let a = 0; a < e; a++) {
					varAtualArray.push(0);
				}
				if (varAtualArray.length==x) {return true} else{tfInterno()}
			}
		}

		// Registra as negacoes
		function negacoes() {
			for(let i in proposicao) {
				if (i>0) {
					if ($.inArray(proposicao[i].charAt(), varRegistradas) !== -1) {
						let j = i-1;
						if (proposicao[j].charAt() ===  '~') {
							valsIniciais['~' + proposicao[i].charAt()]=[];
							
							for (let k of valsIniciais[proposicao[i].charAt()]) {
								valsIniciais['~' + proposicao[i].charAt()].push(negacao(k))
							}
						}
					}
				}else(i++)
			}	
		}
	}

	// A função que resolve a proposição em si, registra todas as variáveis e os pares de variáveis ou sub proposições
	// depois, para cada par, resolve e registra as respostas na arvore[]
	function preencherArvore () {
			let expo = 2;
			
			linhasCont = Math.pow(expo,varRegistradas.length);

			let var1 = null;
			let var2 = null;
			let iniIndex;
			let ultIndex;
	
			for(let z of formulaLog) {
				var1 = null;
				var2 = null;
				iniIndex=0;
				ultIndex=0;
				
				let propAtual = z;
				
				registrarPares(propAtual);
				registrarVariaveis(propAtual);
				arvore[propAtual]=[];
	
				let primOp = getPrimOp(propAtual);
				let neg = ehPropNegada(propAtual);
				
				// Loop para cada um dos pares
				for(let j = 0; j < linhasCont; j++) {
					// Resolver quando existem variáveis simples | Ex: (x v y)
					if (var1.length < 3 && var2.length < 3) {
						resolverPar(propAtual, valsIniciais[var1][j], valsIniciais[var2][j], primOp, neg);

					// Resolver quando existe uma variável simples e uma sub formula | Ex: (x v (x & y))
					} else if (var1.length < 3 && var2.length > 2) {
						resolverPar(propAtual, valsIniciais[var1][j], arvore[var2][j], primOp, neg);

					// Resolver quando existe uma sub formula e uma variável simples | Ex: ((x v y) & y)
					} else if (var1.length > 2 && var2.length < 3) {
						resolverPar(propAtual, arvore[var1][j], valsIniciais[var2][j], primOp, neg);

					// Resolver quando as duas var são sub formulas | Ex: ((x v y) & y)	
					} else if (var1.length > 2 && var2.length > 2) {
						resolverPar(propAtual, arvore[var1][j], arvore[var2][j], primOp, neg);
					}
			}
			
			// Verifica se a proposicao ou sub proposicao é negada "~("
			function ehPropNegada(propAtual) {
				let justNeg1 = propAtual.replace(var1, '');
				let justNeg2 = justNeg1.replace(var2,'');
				if (justNeg2.includes('~(')) {return true} else {return false}
			}
			
			// Traz a primeira operacao da proposição atual
			function getPrimOp(propAtual) {
				let primOp;
				let op1 = propAtual.replace(var1, '');
				let op2 = op1.replace(var2, '');
				for(let i of op2) {
					if (i.match(/&|v|>|%/)) {
						primOp=i;
						return primOp;
					}
				}
			}
			
			// Registra todas as variáveis da proposicao atual
			function registrarVariaveis(propAtual) {
				for(let i=iniIndex; i<ultIndex;i++) {
					if ($.inArray(propAtual[i], varRegistradas) !== -1 && (var1  ===  null)) {
						if (propAtual[i-1] === '~') {var1='~'+propAtual[i]} else{var1 = propAtual[i]}	
					}else if ($.inArray(propAtual[i], varRegistradas) !== -1 && (var1 !== null)) {
						if (var2  ===  null) {
							if (propAtual[i-1] === '~') {var2='~'+propAtual[i]} else{var2 = propAtual[i]}
						} else {i++}
					}
				}
			}
	
			// Resolve um par de variáveis com a operação entre eles
			function resolverPar (propAtual, var1Val, var2Val, op, neg) {
				let resposta;
				if (op  ===  'v') {resposta = Math.max(var1Val,var2Val)}
				if (op  ===  '&') {resposta = Math.min(var1Val,var2Val)}
				if (op  ===  '>') {resposta = Math.max(negacao(var1Val),var2Val)}
				if (op  ===  '%') {resposta = Number(var1Val == var2Val)}
				
				if (neg) {arvore[propAtual].push(negacao(resposta))}
				else if (!neg) {arvore[propAtual].push(resposta)}
			}
	
			function registrarPares(propAtual) {
	
				let parentEsq = 0;
				for(let i of propAtual) {
						if (i.match(/\(/)) {parentEsq++}
					}
				
				if (parentEsq >1) {
					let anterior = parentEsq - 1;
	
					let ordem = Object.getOwnPropertyNames(arvore);

					// Analisando a formula antes do parentEsq
					for (let i = 0; i < anterior; i++) { 
						
						// Loop para cada fórmula da árvore em reverso
						for(let j = ordem.length-1; j > -1; j--) {
						
							let ant = ordem[j];
							let antEsq = 0; 
							
							// Conta as aberturas de parenteses
							for(let i of ant) {
								if (i.match(/\(/)) {
									antEsq++;
								}
							};
							
							// Se a contagem de abertura de parenteses chegou até o parentese da esq
							if (antEsq === anterior && (propAtual.indexOf(ant) !== -1)) {
								let antIndex = propAtual.indexOf(ant);
								let antPrevio = antIndex - 1;
								
								// Se antes da abertura exisitia alguma operacao, registra as variáveis
								if (($.inArray(propAtual[antPrevio], '&v>%') !== -1)) {
									var2 = ant;
									iniIndex = 0; 
									ultIndex = antIndex;
								} else {
									var1=ant; 
									iniIndex = antIndex + ant.length;
									ultIndex = propAtual.length;
								}

								return true;
	
							} else if (antEsq === anterior-i && (propAtual.indexOf(ant)!==-1)) {
								let propoCopia = propAtual.replace(ant, '');

								for(let k = ordem.length-1; k > -1; k--) {
									let ant2 = ordem[k];
								
									if (propoCopia.indexOf(ant2) !== -1 && ((propoCopia.length - ant2.length == 3)||(propoCopia.length - ant2.length == 4))) {
										let tempIndex = propoCopia.indexOf(ant2);

										if ($.inArray(propoCopia[tempIndex-1], operadores) !== -1) {
											var1 = ant; 
											
											var2 = ant2;
										} else {
											var1=ant2; 
											
											var2 = ant;
										}	
	
										break;
									}
								}
								
								return true;
							}
						}
					}
				} else {
					ultIndex = propAtual.length;
				}
			}
		}
		}

		// Conta a quantidade de operadores na proposição
		function contOperadores(propAtual) {
			let cont = 0;
			for(let i of propAtual) {
					if (i.match(/&|v|>|%/)) {cont++}
			} 
			return cont;
		}

		// Retorna T para verdadeiro e F para falso
		function formatarResposta(val) {
			if (val === 1) {
				return 'T'
			} else {
				return 'F'
			}
		}
		
		// Função que converte os símbolos UTF-8 digitados para os símbolos lógicos
		function formatarPropo(original) {
			let formatada = '';
			
			for(let i = 0; i < original.length; i++) {
				if (original[i] ===  '&') {formatada = formatada+'&#8896;'}
				else if (original[i] === 'v') {formatada = formatada+'&#8897;'}
				else if (original[i] === '>') {formatada = formatada+'&#8594;'}
				else if (original[i] === '%') {formatada = formatada+'&#8596;'}
				else if (original[i] === '~') {formatada = formatada+'&#172;'}
				else{formatada = formatada+original[i]}
			}
			
			formatada = formatada.toUpperCase();
			return formatada;
		}

		function gerarTabelaLatex(){
			let variaveis = Object.getOwnPropertyNames(valsIniciais);
			let cabecalho = variaveis.concat(formulaLog);

			let codigo = '\\begin{table}[]\n';
			codigo = codigo + '\\begin{tabular}{|l|l|l|l|l|}\n';
			codigo = codigo + '\\hline\n';
	
			//Gera o cabecalho
 			for(let i=0; i<cabecalho.length; i++) {			
				 propoTemp = formatarPropo(cabecalho[i]);
				 
				 if(i == cabecalho.length - 1){
					 codigo = codigo + propoTemp + ' \\\\';
				 } else {
					 codigo = codigo + propoTemp + ' & ';
				 }
			 }
			 
			 codigo = codigo + '\\hline\n';

			 // Preenche a tabela
			for(let j=0; j<linhasCont; j++) {
				for(let k=0; k<cabecalho.length; k++) {
					if (valsIniciais[cabecalho[k]] !== undefined) {
						propoTemp = formatarResposta(valsIniciais[cabecalho[k]][j]);
						if(k == cabecalho.length - 1){
							codigo = codigo + propoTemp;
						} else {
							codigo = codigo + propoTemp + " & ";
						}
					}else if (arvore[cabecalho[k]] !== undefined) {
						propoTemp = formatarResposta(arvore[cabecalho[k]][j]);
						if(k == cabecalho.length - 1){
							codigo = codigo + propoTemp;
						} else {
							codigo = codigo + propoTemp + " & ";
						}
					}
				}
				codigo = codigo + ' \\\\ \\hline\n';
			}

			codigo = codigo + '\\end{tabular}\n';
			codigo = codigo + '\\end{table}\n';

			console.log("Código Latex criado: \n" + codigo);

			$('#codigoLatex').append('<textarea class=\'codigo\' readonly>' + codigo + '</textarea>');
		}

		// Função geradora da tabela verdade
 		function tabelaVerdade() {
			$('#tabelaVerdade').append('<table class=\'tabela\'><thead></thead><tbody></tbody></table>');						 			
 			
			let variaveis = Object.getOwnPropertyNames(valsIniciais);
			let cabecalho = variaveis.concat(formulaLog);
			let linhaTemp = '<tr>';
			let propoTemp;
			let coluna;

 			//Gera o cabecalho
 			for(let i=0; i<cabecalho.length; i++) {			
 				propoTemp = formatarPropo(cabecalho[i]);
 				linhaTemp = linhaTemp + '<th class=\'col'+i+'\' id=\'headForm'+i+'\'>'+ propoTemp+'</th>';
 			}linhaTemp =linhaTemp+'</tr>';
			
			$('#tabelaVerdade').find('thead').append(linhaTemp); 
 			
 			// Preenche a tabela
			for(let j=0; j<linhasCont; j++) {
				linhaTemp = '<tr>';
				for(let k=0; k<cabecalho.length; k++) {
					if (valsIniciais[cabecalho[k]] !== undefined) {
						propoTemp = formatarResposta(valsIniciais[cabecalho[k]][j]);
						linhaTemp = linhaTemp + '<td class=\'col'+k+'\'>' + propoTemp +'</td>';
					}else if (arvore[cabecalho[k]] !== undefined) {
						propoTemp = formatarResposta(arvore[cabecalho[k]][j]);
						linhaTemp = linhaTemp + '<td class=\'col'+k+'\'>' + propoTemp +'</td>';
					}
				}linhaTemp = linhaTemp + '</tr>';
				$('#tabelaVerdade').find('tbody').append(linhaTemp)
			}

			for(let i=0; i < cabecalho.length; i++) {
				coluna = 'col'+i;
				$('.'+coluna).outerWidth($('#headForm'+i).outerWidth())
			}

			$('#mostrarLatex').show();
 		}

		 // Função principal de validação, chama as demais funções de validação complementares
		function validarForma (proposicao) {
			if (proposicao.length  ===  0) {
				$('<p class =\'erro\'>Informe uma proposição</p>').insertAfter('.buttons');
				return false;
			} else {

				if (!validarProp(proposicao)) {$('<p class =\'erro\'>Proposição inválida pois contém um ou mais caracteres inválidos</p>').insertAfter('.buttons');
				return false;}

				if (proposicao.length  ===  1) {
					if ($.inArray(proposicao[0], '&v>%()~') !== -1) {
						$('<p class =\'erro\'>Proposição inválida pois nenhuma variável foi encontrada</p>').insertAfter('.buttons');
						return false;
					} else {return true;}


				}if (proposicao.length  ===  2 && (proposicao[0]!== '~')|proposicao[1]=='~') {
					$('<p class =\'erro\'>Proposição inválida pois existe uma variável seguida ou antecedida por outra</p>').insertAfter('.buttons');
					return false;
				}else if (proposicao.length  ===  2 && (proposicao[0] ===  '~')&& proposicao[1]!=='~') {
					return true;
				} else {
					
					encontrarPrimeiraVar:{ 
						for(let i in proposicao) {
							let x = proposicao[i].charAt();
							for (var j in variaveisAceitas) {
								let y = variaveisAceitas[j].charAt();
								if (y === x) {
									primVar = i;
									break encontrarPrimeiraVar;
								}
							}
						}
					
					}if (primVar === undefined) {
						$('<p class =\'erro\'>Proposição inválida pois nenhuma variável foi encontrada</p>').insertAfter('.buttons');
						return false;
					}
					if (!combinarParent(proposicao)) {$('<p class =\'erro\'>Proposição inválida pois não foram encontrados parênteses ou nem todos os parênteses abertos foram fechados</p>').insertAfter('.buttons');return false}
					if (!validaEsq(proposicao)) {return false}
					if (!validaDir(proposicao)) {return false}
					if (contOperadores(proposicao) === 0) {$('<p class =\'erro\'>Proposição inválida pois não possui nenhum operador binário</p>').insertAfter('.buttons');return false}
					if (!analisarParenteses(proposicao)) {$('<p class =\'erro\'>Proposição inválida pois a distribuição dos parênteses está incorreta</p>').insertAfter('.buttons');return false}
						else{return true}
				}	
			}
		}

		// Verifica a existência de caracteres ilegais na proposição
		function validarProp(proposicao) {
			var ilegais = '0123456789`!@#$^*_-+=:<;"\',./\\[]{}|?';

			for(var i=0; i<proposicao.length; i++) {
				var x = proposicao[i].charAt();

				for (var j in ilegais) {
					var y = ilegais[j].charAt();

					if (y==x) {
						return false;
					}
				}	
			}
			return true;
		}

		// Função que verifica se a contagem de abertura de parênteses é a mesma da do
		// fechamento de parênteses
		function combinarParent(proposicao) {
			let contEsq = 0; 
			let contDir = 0;
			let contOper = 0;
				for(let i of proposicao) {
					if (i.match(/\(/)) {
						contEsq++;
					}
					if (i.match(/\)/)) {
						contDir++;
					}
					if (i.match(/&|v|>|%/)) {
						contOper++;
					}
				}if (contOper > 0 && ((contEsq !== contDir)|contEsq + contDir !== contOper*2)) {return false}
				else{return true}
		}

		// Caminha da primeira variável até a posição 0 na proposição
		// e valida se toda a parte da esquerda da proposição é válida
		// Ex.: Verifica se antes de uma variável, o caractere anterior é válido
		function validaEsq(proposicao) {
			let x = primVar;
			let y = primVar - 1;
			if (y<0) {
				$('<p class =\'erro\'>Proposição inválida pois existe uma variável seguida ou antecedida de outra</p>').insertAfter('.buttons');
				
				return false; 
			}

			x--;
			
			fimEsq(proposicao);

			if (x<0) {
				return true
			}

			function fimEsq(proposicao) {
				if (x < 0) {
					return true
				}
				else{
					prossegEsq(proposicao);
				}
			}
			
			function prossegEsq(proposicao) {
				let z = proposicao[x];

				if ($.inArray(z, '&v>%') !== -1) {
					$('<p class =\'erro\'>Proposição Inválida: Existe um operador binário isolado de variáveis</p>').insertAfter('.buttons');
					
					return false;
				} else {
					x--; fimEsq(proposicao)
				}
			}
		}

		// Caminha da primeira variável até a última posição na proposição
		// e valida se toda a parte da direta da proposição é válida
		// Ex.: Verifica se após uma variável, o próximo caractere é válido
		function validaDir(proposicao) {
			let x = primVar;
			let y = primVar - 1;
				x++; y++;
				
				fimDir(proposicao);
				if (x==proposicao.length) {return true}
				
			function fimDir(proposicao) {
				if (x==proposicao.length) {
					return true
				} else { 
					prossegDir(proposicao);
				}
			}
			
			function prossegDir(proposicao) {

				let tempX = proposicao[x];

				let w = proposicao[y];

				if ($.inArray(tempX, '&v>%') !== -1) {
					if ($.inArray(w, '&v>%(~') !== -1) {
						$('<p class =\'erro\'> Proposição Inválida: Existe um operador binário isolado de variáveis</p>').insertAfter('.buttons');
						return false;
					}
				}if ($.inArray(tempX, '(') !== -1) {
					if ($.inArray(w, ')qwertyuiopasdfghjklzxcbnm') !== -1) {
						$('<p class =\'erro\'>Proposição inválida: \'(\' só pode ser seguido de uma variável</p>').insertAfter('.buttons');
						return false;
					}
				}if ($.inArray(tempX, ')') !== -1) {
					if ($.inArray(w, '&v>%(~') !== -1) {
						$('<p class =\'erro\'>Proposição inválida: \')\' só pode ser seguido de uma variável</p>').insertAfter('.buttons');
						return false;
					}
				}if ($.inArray(tempX, '~') !== -1) {
					if ($.inArray(w, ')qwertyuiopasdfghjklzxcbnm') !== -1) {
						$('<p class =\'erro\'> Proposição inválida: A negação não pode ser acompanhada de um outro operador</p>').insertAfter('.buttons');
						return false;
					}
				}if ($.inArray(tempX, variaveisAceitas) !== -1) {
					if ($.inArray(w, ')qwertyuiopasdfghjklzxcbnm') !== -1) {
						$('<p class =\'erro\'>Proposição Inválida: Uma variável só pode estar acompanhada de um operador de negação, um parentese ou um operador binário.</p>').insertAfter('.buttons');
						return false;
					}
				}x++; y++;
				fimDir(proposicao);
			}
		}
		
		// Função auxiliar ao validaEsq e validaDir. Serve para verificar os casos que não entram nas duas funções anteriores,
		// por exemplo, ((x v (y v x) v y)). A função encontra o  último '(' e o primeiro ')'  após ele, tudo entre os dois é considerado
		// uma "nova proposição" que é analisada por si só, o loop se repete até que toda a proposição seja analisada
		function analisarParenteses(proposicao) {			
				let idxEsq = [];
				let idxDir = [];
				let x = proposicao.lastIndexOf('(');
				let y = proposicao.indexOf(')'); 
				let iniY = proposicao.indexOf(')');
				
				// Para uma proposicao do tipo ((x v y) & (x & y)) o índice y será menor que o x
				// logo, sera preciso encontrar o último índice y correto
				if (y < x) {
					for(let tempY = x; tempY < proposicao.length; tempY++) {
						let tempYChar = proposicao[tempY].charAt();

						if (tempYChar==')') {
							y = tempY;
							break;
						}
					}
				}
					
				if (x > 0) {
					let aa = ehNegacao(x);
					x = x - aa;
				}

				idxEsq.push(x);
				idxDir.push(y);
				
				if (!verifCentro(proposicao.slice(x, y + 1))) {
					return false;
				}
				
				formulaLog.push(proposicao.slice(x, y+1))
				
				if (x==0) {
					return true;
				} else {
					return encontrarParentAnt(x);
				}
				
				// Verifica se entre x e y existem mais parênteses
				function verifCentro(tX) {
					let parentDir = 0;
					for(let i of tX) {
						if (i.match(/\)/)) {
							parentDir++;
						}
					}
					if (parentDir !== contOperadores(tX)) {
						return false;
					} else {
						return true;
					}
				}	
				
				// Verifica se o caract anterior é uma negação, se for, verifica que a negação se aplica a um parenteses
				// Retorna a quantidade de passos pra trás que o posicionador x deve dar
				function ehNegacao(x) {
					let xPrev = x - 1;

					if (proposicao[xPrev].charAt() == '~') {
						if (proposicao[xPrev].charAt() == '(') {
							return 2;
						} else {
							return 1;
						}
					} else {
						return 0;
					}
				}


				function encontrarParentAnt(tX) {
					if (tX == 0) {
						return true;
					}
						
					let esq = tX;
					for(let a = tX-1; a> -1; a--) {
						let b = proposicao[a].charAt();
						if (a>0) {if (ehNegacao(a)>0) {
							a = a - ehNegacao(a);
						}}

						if (b =='(') {
							idxEsq.push(a);
							esq=a;
							break;}
						let ehOperador = proposicao[a].charAt();	
						
						if (($.inArray(ehOperador, '&v>%') !== -1) && (!x>iniY)) {
							a--; 
							esq = a;
							break;
						}
					}
					
					let ehVar = proposicao[esq].charAt();
					
					// Verifica se o caract anterior ao parentese eh uma variavel
					if ($.inArray(ehVar, 'abcdefghijklmnopqrstuxwyz') !== -1) {
						return encontrarParentAnt(esq);
					}	
					
					if (!encontrarParentApos(esq)) {
						return false;
					} else {
						return encontrarParentAnt(esq);
					}
					
					function encontrarParentApos(e) {
						let achou = false;
						for(let c = e; c < proposicao.length; c++) {
							let d = proposicao[c].charAt();
							if (d==')') {
								if ($.inArray(c, idxDir) == -1) {
									let p = proposicao.slice(esq, c+1)
									if (!combinarParent(p)) {return false}
									else{idxDir.push(c);
									achou = true;
									if (!verifCentro(proposicao.slice(esq, c+1))) {return false};
									formulaLog.push(proposicao.slice(esq, c+1));
									break;}
								}
							}
							if (achou) {break}
						}
						if (achou) {return true}
					}
				}
			}
})
